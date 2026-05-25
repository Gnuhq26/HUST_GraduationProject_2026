import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma';

/* Cấu trúc include dùng cho query export */
const inventoryExportInclude = {
  product: {
    select: {
      SKU: true,
      ProductName: true,
      category: { select: { CategoryName: true } },
    },
  },
} satisfies Prisma.InventoryInclude;

type InventoryWithRelations = Prisma.InventoryGetPayload<{
  include: typeof inventoryExportInclude;
}>;

@Injectable()
export class InventoryExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export danh sách tồn kho ra file Excel và stream trực tiếp vào Response.
   */
  async exportToExcel(
    res: Response,
    storeId: number,
    filters: { search?: string; lowStockThreshold?: number },
  ) {
    const rows = await this.prisma.inventory.findMany({
      where: {
        StoreID: storeId,
        ...(filters.search && {
          product: {
            OR: [
              { ProductName: { contains: filters.search } },
              { SKU: { contains: filters.search } },
            ],
          },
        }),
        ...(filters.lowStockThreshold !== undefined && {
          Quantity: { lte: filters.lowStockThreshold },
        }),
      },
      include: inventoryExportInclude,
      orderBy: { product: { ProductName: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GR2 System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Tồn kho', {
      pageSetup: { fitToPage: true, orientation: 'landscape' },
    });

    /* ---- Định nghĩa cột ---- */
    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Tên sản phẩm', key: 'name', width: 32 },
      { header: 'Danh mục', key: 'category', width: 22 },
      { header: 'Tồn kho', key: 'quantity', width: 14 },
      { header: 'Đặt trước', key: 'reserved', width: 14 },
      { header: 'Đang về', key: 'inTransit', width: 14 },
      { header: 'Khả dụng', key: 'available', width: 14 },
      { header: 'Cập nhật lần cuối', key: 'lastUpdated', width: 22 },
    ];

    /* ---- Style header ---- */
    const headerRow = sheet.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
      };
    });

    /* ---- Điền dữ liệu ---- */
    rows.forEach((inv: InventoryWithRelations, idx: number) => {
      const qty = Number(inv.Quantity);
      const reserved = Number(inv.ReservedQty);
      const inTransit = Number(inv.InTransitQty);
      const available = qty - reserved + inTransit; // +inTransit: hàng sắp về tính vào khả dụng

      const row = sheet.addRow({
        sku: inv.product.SKU,
        name: inv.product.ProductName,
        category: inv.product.category?.CategoryName ?? '',
        quantity: qty,
        reserved: reserved,
        inTransit: inTransit,
        available: available,
        lastUpdated: inv.LastUpdated,
      });

      row.height = 20;

      /* Zebra striping */
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F7FF' },
          };
        });
      }

      /* Format số */
      const numFmt = '#,##0.##';
      (['quantity', 'reserved', 'inTransit', 'available'] as const).forEach(
        (key) => {
          const cell = row.getCell(key);
          cell.numFmt = numFmt;
          cell.alignment = { horizontal: 'right' };
        },
      );

      /* Tô đỏ nếu khả dụng <= 0 */
      if (available <= 0) {
        row.getCell('available').font = { color: { argb: 'FFCC0000' }, bold: true };
      }

      /* Format ngày */
      const dateCell = row.getCell('lastUpdated');
      dateCell.numFmt = 'dd/mm/yyyy hh:mm';
      dateCell.alignment = { horizontal: 'center' };
    });

    /* ---- Freeze header ---- */
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    /* ---- Stream response ---- */
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="ton-kho.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
