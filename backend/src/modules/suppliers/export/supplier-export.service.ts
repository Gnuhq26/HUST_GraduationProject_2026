import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';

/** Cấu trúc include dùng cho query export */
const supplierExportInclude = {
  receipts: {
    select: { TotalAmount: true, PaidAmount: true, Status: true },
  },
} satisfies Prisma.SupplierInclude;

type SupplierWithReceipts = Prisma.SupplierGetPayload<{
  include: typeof supplierExportInclude;
}>;

@Injectable()
export class SupplierExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export danh sách nhà cung cấp ra file Excel kèm thông tin công nợ.
   */
  async exportToExcel(
    res: Response,
    storeId: number,
    filters: { search?: string },
  ) {
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        StoreID: storeId,
        ...(filters.search && {
          OR: [
            { SupplierName: { contains: filters.search } },
            { Phone: { contains: filters.search } },
          ],
        }),
      },
      include: supplierExportInclude,
      orderBy: { CreatedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS System';
    const sheet = workbook.addWorksheet('Nhà cung cấp');

    this.setupColumns(sheet);
    this.styleHeader(sheet);
    this.addDataRows(sheet, suppliers);
    this.formatNumberColumns(sheet);

    await workbook.xlsx.write(res);
  }

  // ── Private helpers ─────────────────────────────────────

  private setupColumns(sheet: ExcelJS.Worksheet) {
    sheet.columns = [
      { header: 'Tên nhà cung cấp', key: 'supplierName', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 18 },
      { header: 'Địa chỉ', key: 'address', width: 40 },
      { header: 'Số phiếu nhập', key: 'receiptCount', width: 14 },
      { header: 'Tổng nhập', key: 'totalImport', width: 18 },
      { header: 'Đã thanh toán', key: 'totalPaid', width: 18 },
      { header: 'Công nợ', key: 'totalDebt', width: 18 },
      { header: 'Ngày tạo', key: 'createdAt', width: 16 },
    ];
  }

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;
  }

  private addDataRows(sheet: ExcelJS.Worksheet, suppliers: SupplierWithReceipts[]) {
    for (const supplier of suppliers) {
      const totalImport = supplier.receipts.reduce(
        (sum, r) => sum + Number(r.TotalAmount),
        0,
      );
      const totalPaid = supplier.receipts.reduce(
        (sum, r) => sum + Number(r.PaidAmount),
        0,
      );

      sheet.addRow({
        supplierName: supplier.SupplierName,
        phone: supplier.Phone ?? '',
        address: supplier.Address ?? '',
        receiptCount: supplier.receipts.length,
        totalImport,
        totalPaid,
        totalDebt: totalImport - totalPaid,
        createdAt: this.formatDate(supplier.CreatedAt),
      });
    }
  }

  private formatNumberColumns(sheet: ExcelJS.Worksheet) {
    sheet.getColumn('totalImport').numFmt = '#,##0';
    sheet.getColumn('totalPaid').numFmt = '#,##0';
    sheet.getColumn('totalDebt').numFmt = '#,##0';
    sheet.getColumn('receiptCount').numFmt = '#,##0';
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
