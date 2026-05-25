import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { Response } from 'express';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../common/prisma';

/* Cấu trúc include dùng cho query export */
const orderExportInclude = {
  customer: { select: { CustomerName: true, Phone: true } },
  user: { select: { FullName: true } },
  _count: { select: { details: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderExportInclude;
}>;

const DELIVERY_METHOD_MAP: Record<string, string> = {
  Immediate: 'Tại quầy',
  Reserved: 'Đặt trước',
  Delivery: 'Giao hàng',
};

const STATUS_MAP: Record<string, string> = {
  Completed: 'Hoàn thành',
  Pending: 'Chờ xử lý',
  Cancelled: 'Đã hủy',
};

@Injectable()
export class OrderExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export danh sách đơn hàng (header only, không có chi tiết sản phẩm)
   * ra file Excel và stream trực tiếp vào Response.
   */
  async exportToExcel(
    res: Response,
    storeId: number,
    filters: { search?: string; status?: string; dateFrom?: string; dateTo?: string },
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        StoreID: storeId,
        ...(filters.status && { Status: filters.status }),
        ...(filters.search && {
          OR: [
            { customer: { CustomerName: { contains: filters.search } } },
            { customer: { Phone: { contains: filters.search } } },
          ],
        }),
        ...((filters.dateFrom || filters.dateTo) && {
          OrderDate: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        }),
      },
      include: orderExportInclude,
      orderBy: { OrderDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GR2 System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Đơn hàng', {
      pageSetup: { fitToPage: true, orientation: 'landscape' },
    });

    /* ---- Định nghĩa cột ---- */
    sheet.columns = [
      { header: 'Mã đơn', key: 'orderId', width: 10 },
      { header: 'Ngày đặt', key: 'orderDate', width: 20 },
      { header: 'Khách hàng', key: 'customerName', width: 28 },
      { header: 'SĐT khách', key: 'phone', width: 16 },
      { header: 'Nhân viên', key: 'staffName', width: 22 },
      { header: 'Phương thức', key: 'deliveryMethod', width: 16 },
      { header: 'Số SP', key: 'itemCount', width: 10 },
      { header: 'Tổng tiền', key: 'totalAmount', width: 18 },
      { header: 'Đã thanh toán', key: 'paidAmount', width: 18 },
      { header: 'Còn lại', key: 'remaining', width: 18 },
      { header: 'Trạng thái', key: 'status', width: 16 },
      { header: 'Ghi chú', key: 'note', width: 30 },
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
    orders.forEach((order: OrderWithRelations, idx: number) => {
      const total = Number(order.TotalAmount);
      const paid = Number(order.PaidAmount);
      const remaining = total - paid;

      const row = sheet.addRow({
        orderId: order.OrderID,
        orderDate: order.OrderDate,
        customerName: order.customer?.CustomerName ?? 'Khách vãng lai',
        phone: order.customer?.Phone ?? '',
        staffName: order.user?.FullName ?? '',
        deliveryMethod: DELIVERY_METHOD_MAP[order.DeliveryMethod] ?? order.DeliveryMethod,
        itemCount: order._count.details,
        totalAmount: total,
        paidAmount: paid,
        remaining: remaining,
        status: STATUS_MAP[order.Status] ?? order.Status,
        note: order.Note ?? '',
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

      /* Format tiền */
      (['totalAmount', 'paidAmount', 'remaining'] as const).forEach((key) => {
        const cell = row.getCell(key);
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      });

      /* Tô đỏ nếu còn nợ */
      if (remaining > 0 && order.Status !== 'Cancelled') {
        row.getCell('remaining').font = { color: { argb: 'FFCC0000' }, bold: true };
      }

      /* Format ngày */
      const dateCell = row.getCell('orderDate');
      dateCell.numFmt = 'dd/mm/yyyy hh:mm';
      dateCell.alignment = { horizontal: 'center' };

      /* Căn giữa mã đơn và số SP */
      row.getCell('orderId').alignment = { horizontal: 'center' };
      row.getCell('itemCount').alignment = { horizontal: 'center' };

      /* Màu trạng thái */
      const statusCell = row.getCell('status');
      statusCell.alignment = { horizontal: 'center' };
      if (order.Status === 'Cancelled') {
        statusCell.font = { color: { argb: 'FFCC0000' } };
      } else if (order.Status === 'Pending') {
        statusCell.font = { color: { argb: 'FFB8860B' } };
      } else {
        statusCell.font = { color: { argb: 'FF006400' } };
      }
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
      'attachment; filename="don-hang.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
