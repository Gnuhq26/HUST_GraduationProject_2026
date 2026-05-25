import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma';

/** Cấu trúc include dùng cho query export */
const customerExportInclude = {
  orders: {
    where: { Status: { not: 'Cancelled' } },
    select: { TotalAmount: true, PaidAmount: true },
  },
} satisfies Prisma.CustomerInclude;

type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: typeof customerExportInclude;
}>;

@Injectable()
export class CustomerExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export danh sách khách hàng ra file Excel kèm thông tin công nợ.
   */
  async exportToExcel(
    res: Response,
    storeId: number,
    filters: { search?: string },
  ) {
    const customers = await this.prisma.customer.findMany({
      where: {
        StoreID: storeId,
        ...(filters.search && {
          OR: [
            { CustomerName: { contains: filters.search } },
            { Phone: { contains: filters.search } },
          ],
        }),
      },
      include: customerExportInclude,
      orderBy: { CreatedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS System';
    const sheet = workbook.addWorksheet('Khách hàng');

    this.setupColumns(sheet);
    this.styleHeader(sheet);
    this.addDataRows(sheet, customers);
    this.formatNumberColumns(sheet);

    await workbook.xlsx.write(res);
  }

  // ── Private helpers ─────────────────────────────────────

  private setupColumns(sheet: ExcelJS.Worksheet) {
    sheet.columns = [
      { header: 'Tên khách hàng', key: 'customerName', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 18 },
      { header: 'Địa chỉ', key: 'address', width: 40 },
      { header: 'Số đơn hàng', key: 'orderCount', width: 14 },
      { header: 'Tổng mua', key: 'totalPurchase', width: 18 },
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

  private addDataRows(sheet: ExcelJS.Worksheet, customers: CustomerWithOrders[]) {
    for (const customer of customers) {
      const totalPurchase = customer.orders.reduce(
        (sum, o) => sum + Number(o.TotalAmount),
        0,
      );
      const totalPaid = customer.orders.reduce(
        (sum, o) => sum + Number(o.PaidAmount),
        0,
      );

      sheet.addRow({
        customerName: customer.CustomerName,
        phone: customer.Phone ?? '',
        address: customer.Address ?? '',
        orderCount: customer.orders.length,
        totalPurchase,
        totalPaid,
        totalDebt: totalPurchase - totalPaid,
        createdAt: this.formatDate(customer.CreatedAt),
      });
    }
  }

  private formatNumberColumns(sheet: ExcelJS.Worksheet) {
    sheet.getColumn('totalPurchase').numFmt = '#,##0';
    sheet.getColumn('totalPaid').numFmt = '#,##0';
    sheet.getColumn('totalDebt').numFmt = '#,##0';
    sheet.getColumn('orderCount').numFmt = '#,##0';
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
