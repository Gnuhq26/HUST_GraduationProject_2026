import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { PrismaService } from '../../../common/prisma';

/** Shape returned by the product findMany query with productExportInclude */
interface ProductWithRelations {
  ProductID: number;
  SKU: string | null;
  ProductName: string;
  BaseUnit: string;
  Description: string | null;
  IsActive: boolean;
  CreatedAt: Date;
  MarginRate: { toString(): string };
  category: { CategoryName: string } | null;
  units: { UnitName: string; ExchangeValue: { toString(): string } }[];
  inventories: {
    Quantity: { toString(): string };
    ReservedQty: { toString(): string };
    InTransitQty: { toString(): string };
  }[];
}

/* Cấu trúc include dùng cho query export */
const productExportInclude = {
  category: { select: { CategoryName: true } },
  units: true,
  inventories: {
    select: { Quantity: true, ReservedQty: true, InTransitQty: true },
  },
};

@Injectable()
export class ProductExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export danh sách sản phẩm ra file Excel và stream trực tiếp vào Response.
   * Flatten 1-N relations (units, prices) để mỗi đơn vị/giá nằm trên 1 dòng riêng.
   */
  async exportToExcel(
    res: Response,
    storeId: number,
    filters: { search?: string; categoryId?: number; isActive?: boolean },
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        StoreID: storeId,
        ...(filters.isActive !== undefined && { IsActive: filters.isActive }),
        ...(filters.categoryId && { CategoryID: filters.categoryId }),
        ...(filters.search && {
          OR: [
            { ProductName: { contains: filters.search } },
            { SKU: { contains: filters.search } },
          ],
        }),
      },
      include: productExportInclude,
      orderBy: { CreatedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS System';
    const sheet = workbook.addWorksheet('Sản phẩm');

    this.setupColumns(sheet);
    this.styleHeader(sheet);
    this.addDataRows(sheet, products);
    this.formatNumberColumns(sheet);

    // Streaming: pipe workbook trực tiếp vào response
    await workbook.xlsx.write(res);
  }

  // ── Private helpers ─────────────────────────────────────

  private setupColumns(sheet: ExcelJS.Worksheet) {
    sheet.columns = [
      { header: 'Mã SKU', key: 'sku', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 35 },
      { header: 'Tên danh mục', key: 'categoryName', width: 20 },
      { header: 'Đơn vị gốc', key: 'baseUnit', width: 14 },
      { header: 'Mô tả', key: 'description', width: 30 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Biên LN (%)', key: 'marginRate', width: 14 },
      { header: 'Đơn vị quy đổi', key: 'unitName', width: 16 },
      { header: 'Hệ số quy đổi', key: 'exchangeValue', width: 16 },
      { header: 'Tồn kho', key: 'quantity', width: 12 },
      { header: 'Đang giữ', key: 'reservedQty', width: 12 },
      { header: 'Đang vận chuyển', key: 'inTransitQty', width: 16 },
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

  private addDataRows(sheet: ExcelJS.Worksheet, products: ProductWithRelations[]) {
    for (const product of products) {
      const inv = product.inventories[0] as
        | (typeof product.inventories)[number]
        | undefined;
      const base = {
        sku: product.SKU ?? '',
        productName: product.ProductName,
        categoryName: product.category?.CategoryName ?? '',
        baseUnit: product.BaseUnit,
        description: product.Description ?? '',
        status: product.IsActive ? 'Hoạt động' : 'Ngưng',
        marginRate: Number(product.MarginRate),
        quantity: inv ? Number(inv.Quantity) : 0,
        reservedQty: inv ? Number(inv.ReservedQty) : 0,
        inTransitQty: inv ? Number(inv.InTransitQty) : 0,
        createdAt: this.formatDate(product.CreatedAt),
      };

      const { units } = product;
      const maxRows = Math.max(1, units.length);

      for (let i = 0; i < maxRows; i++) {
        const unit = units[i] as (typeof units)[number] | undefined;

        sheet.addRow({
          // Chỉ hiện thông tin sản phẩm ở dòng đầu tiên
          ...(i === 0 ? base : { sku: base.sku }),
          unitName: unit?.UnitName ?? '',
          exchangeValue: unit ? Number(unit.ExchangeValue) : null,
        });
      }
    }
  }

  private formatNumberColumns(sheet: ExcelJS.Worksheet) {
    // Cột biên lợi nhuận - hiển thị % (0.15 → 15.00%)
    sheet.getColumn('marginRate').numFmt = '0.00%';
    // Cột hệ số quy đổi
    sheet.getColumn('exchangeValue').numFmt = '#,##0.##';
    // Cột tồn kho
    sheet.getColumn('quantity').numFmt = '#,##0.##';
    sheet.getColumn('reservedQty').numFmt = '#,##0.##';
    sheet.getColumn('inTransitQty').numFmt = '#,##0.##';
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
