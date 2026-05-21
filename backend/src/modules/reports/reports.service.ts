import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportQueryDto, TopProductsQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Báo cáo Doanh thu theo khoảng thời gian
   * - confirmedRevenue: Tổng TotalAmount đơn Completed (doanh thu đã chốt)
   * - pendingRevenue: Tổng PaidAmount đơn Pending (tiền cọc đã thu)
   * - totalRevenue: confirmedRevenue + pendingRevenue
   */
  async getRevenueReport(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    const dateFilter = {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z'),
    };

    // Tiền thực thu từ đơn hoàn tất: SUM(PaidAmount) của đơn Completed
    const completedResult = await this.prisma.order.aggregate({
      where: {
        StoreID: storeId,
        OrderDate: dateFilter,
        Status: 'Completed',
      },
      _sum: { PaidAmount: true, TotalAmount: true },
      _count: { _all: true },
    });

    // Tiền cọc đặt trước: SUM(PaidAmount) của đơn Pending
    const pendingResult = await this.prisma.order.aggregate({
      where: {
        StoreID: storeId,
        OrderDate: dateFilter,
        Status: 'Pending',
      },
      _sum: { PaidAmount: true, TotalAmount: true },
      _count: { _all: true },
    });

    const totalSalesValue = Number(completedResult._sum.TotalAmount || 0);  // Doanh số: tổng TotalAmount đơn Completed
    const confirmedRevenue = Number(completedResult._sum.PaidAmount || 0);  // Tiền thực thu từ đơn Completed
    const debtIncurred = totalSalesValue - confirmedRevenue;                // Công nợ phát sinh từ hàng đã giao
    const pendingDeposit = Number(pendingResult._sum.PaidAmount || 0);      // Tiền cọc đơn Pending
    const pendingTotalValue = Number(pendingResult._sum.TotalAmount || 0);

    return {
      startDate,
      endDate,
      totalSalesValue,
      confirmedRevenue,
      debtIncurred,
      pendingDeposit,
      pendingTotalValue,
      totalRevenue: confirmedRevenue + pendingDeposit,
      completedOrders: completedResult._count._all,
      pendingOrders: pendingResult._count._all,
      totalOrders: completedResult._count._all + pendingResult._count._all,
    };
  }

  /**
   * Báo cáo Lợi nhuận theo khoảng thời gian
   * Profit = Σ (Quantity × (UnitPrice - CostPrice))
   */
  async getProfitReport(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    // Lấy OrderDetails chỉ của đơn Completed (doanh thu đã chốt)
    const orderDetails = await this.prisma.orderDetail.findMany({
      where: {
        order: {
          StoreID: storeId,
          OrderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z'),
          },
          Status: 'Completed',
        },
      },
      select: {
        Quantity: true,
        UnitPrice: true,
        CostPrice: true,
      },
    });

    // Tính tổng lợi nhuận
    let totalProfit = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const detail of orderDetails) {
      const quantity = Number(detail.Quantity);
      const unitPrice = Number(detail.UnitPrice);
      const costPrice = Number(detail.CostPrice);

      const revenue = quantity * unitPrice;
      const cost = quantity * costPrice;
      const profit = quantity * (unitPrice - costPrice);

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;
    }

    return {
      startDate,
      endDate,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  }

  /**
   * Top sản phẩm bán chạy nhất
   * Có thể sắp xếp theo doanh thu hoặc số lượng bán
   */
  async getTopProducts(storeId: number, query: TopProductsQueryDto) {
    const { startDate, endDate, sortBy = 'revenue', limit = 10 } = query;

    // Lấy dữ liệu OrderDetail chỉ của đơn Completed
    const orderDetails = await this.prisma.orderDetail.findMany({
      where: {
        order: {
          StoreID: storeId,
          OrderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z'),
          },
          Status: 'Completed',
        },
      },
      select: {
        ProductID: true,
        Quantity: true,
        UnitPrice: true,
        product: {
          select: {
            ProductName: true,
            SKU: true,
            BaseUnit: true,
          },
        },
      },
    });

    // Gom nhóm theo ProductID
    const productMap = new Map<
      number,
      {
        productId: number;
        productName: string;
        sku: string | null;
        baseUnit: string;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const detail of orderDetails) {
      const productId = detail.ProductID;
      const quantity = Number(detail.Quantity);
      const unitPrice = Number(detail.UnitPrice);
      const revenue = quantity * unitPrice;

      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!;
        existing.totalQuantity += quantity;
        existing.totalRevenue += revenue;
      } else {
        productMap.set(productId, {
          productId,
          productName: detail.product.ProductName,
          sku: detail.product.SKU,
          baseUnit: detail.product.BaseUnit,
          totalQuantity: quantity,
          totalRevenue: revenue,
        });
      }
    }

    // Chuyển Map thành Array và sắp xếp
    let products = Array.from(productMap.values());

    if (sortBy === 'revenue') {
      products.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else {
      products.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }

    // Giới hạn số lượng
    products = products.slice(0, Number(limit));

    return {
      startDate,
      endDate,
      sortBy,
      products,
    };
  }

  /**
   * Doanh thu theo danh mục sản phẩm
   * Dùng cho PieChart trên Dashboard
   */
  async getRevenueByCategoryReport(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    type RawCategoryRow = {
      categoryId: number;
      categoryName: string;
      totalRevenue: string | number;
    };

    const rows = await this.prisma.$queryRaw<RawCategoryRow[]>`
      SELECT
        p.CategoryID AS categoryId,
        c.CategoryName AS categoryName,
        SUM(od.Quantity * od.UnitPrice) AS totalRevenue
      FROM OrderDetail od
      JOIN \`Order\` o ON od.OrderID = o.OrderID
      JOIN Product p ON od.ProductID = p.ProductID
      JOIN Category c ON p.CategoryID = c.CategoryID
      WHERE o.StoreID = ${storeId}
        AND o.Status != 'Cancelled'
        AND DATE(o.OrderDate) BETWEEN ${startDate} AND ${endDate}
      GROUP BY p.CategoryID, c.CategoryName
      ORDER BY totalRevenue DESC
    `;

    const total = rows.reduce((sum, r) => sum + Number(r.totalRevenue), 0);

    const items = rows.map((r) => ({
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName,
      totalRevenue: Number(r.totalRevenue),
      percentage: total > 0 ? (Number(r.totalRevenue) / total) * 100 : 0,
    }));

    return { items, totalRevenue: total };
  }

  /**
   * Xu hướng tồn kho ảo theo ngày
   * - inTransitQty: Tổng SL StockReceipt Pending gom theo ngày
   * - reservedQty: Tổng SL Order Pending gom theo ngày
   */
  async getVirtualInventoryTrend(storeId: number, query: ReportQueryDto) {
    const { startDate, endDate } = query;

    type RawInTransit = { date: Date | string; inTransitQty: string | number };
    type RawReserved = { date: Date | string; reservedQty: string | number };

    const [inTransitRows, reservedRows] = await Promise.all([
      this.prisma.$queryRaw<RawInTransit[]>`
        SELECT
          DATE(sr.ImportDate) AS date,
          SUM(sd.Quantity) AS inTransitQty
        FROM StockReceipt sr
        JOIN StockReceiptDetail sd ON sr.ReceiptID = sd.ReceiptID
        WHERE sr.StoreID = ${storeId}
          AND sr.Status = 'Pending'
          AND DATE(sr.ImportDate) BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(sr.ImportDate)
        ORDER BY date
      `,
      this.prisma.$queryRaw<RawReserved[]>`
        SELECT
          DATE(o.OrderDate) AS date,
          SUM(od.Quantity) AS reservedQty
        FROM \`Order\` o
        JOIN OrderDetail od ON o.OrderID = od.OrderID
        WHERE o.StoreID = ${storeId}
          AND o.Status = 'Pending'
          AND DATE(o.OrderDate) BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(o.OrderDate)
        ORDER BY date
      `,
    ]);

    // Normalize date keys to YYYY-MM-DD strings
    const toDateKey = (d: Date | string): string => {
      if (typeof d === 'string') return d.substring(0, 10);
      return d.toISOString().substring(0, 10);
    };

    const mergedMap = new Map<string, { inTransitQty: number; reservedQty: number }>();

    for (const r of inTransitRows) {
      const key = toDateKey(r.date);
      mergedMap.set(key, { inTransitQty: Number(r.inTransitQty), reservedQty: 0 });
    }
    for (const r of reservedRows) {
      const key = toDateKey(r.date);
      const existing = mergedMap.get(key);
      if (existing) {
        existing.reservedQty = Number(r.reservedQty);
      } else {
        mergedMap.set(key, { inTransitQty: 0, reservedQty: Number(r.reservedQty) });
      }
    }

    const points = Array.from(mergedMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return { startDate, endDate, points };
  }
}
