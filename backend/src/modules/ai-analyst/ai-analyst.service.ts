import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  StoreAnalyticsData,
  RevenueData,
  LowStockProduct,
  InTransitProduct,
  CustomerDebtSummary,
} from './interfaces/store-analytics.interface';

/** Ngưỡng tồn kho thấp: sản phẩm có số lượng ≤ giá trị này sẽ được coi là sắp hết hàng */
const LOW_STOCK_THRESHOLD = 20;
/** Thời gian sống của cache phân tích AI (30 phút) – tránh gọi API liên tục */
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút
/** Số lượng tối đa entry trong cache (tránh rò rỉ bộ nhớ) */
const MAX_CACHE_SIZE = 500;
/** Timeout cho mỗi lần gọi Gemini API (ms) */
const GEMINI_TIMEOUT_MS = 15_000;

/** Cấu trúc một entry trong bộ nhớ cache in-memory */
interface CacheEntry {
  /** Nội dung phân tích AI (Markdown) */
  insights: string;
  /** Thời điểm tạo ra insights */
  generatedAt: Date;
  /** Unix timestamp (ms) khi cache hết hạn */
  expiresAt: number;
}

@Injectable()
export class AiAnalystService {
  private readonly logger = new Logger(AiAnalystService.name);
  /** Instance model Gemini — null nếu GEMINI_API_KEY chưa được cấu hình */
  private model: GenerativeModel | null = null;
  /** Cache in-memory: storeId → CacheEntry. Tránh gọi Gemini API liên tục */
  private cache = new Map<number, CacheEntry>();

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful degradation: chỉ log warning, app vẫn khởi động bình thường.
      // Endpoint AI sẽ trả 503 thay vì làm crash toàn bộ backend.
      this.logger.warn('GEMINI_API_KEY is not configured. AI Analyst feature will be disabled.');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });
  }

  // ==========================================
  // DATA RETRIEVAL (Phase 2)
  // ==========================================

  /**
   * Tổng hợp doanh thu và số đơn hàng trong 30 ngày gần nhất.
   * Loại trừ các đơn có trạng thái 'Cancelled'.
   */
  async getRevenueData(storeId: number): Promise<RevenueData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.order.aggregate({
      where: {
        StoreID: storeId,
        Status: { not: 'Cancelled' },
        OrderDate: { gte: thirtyDaysAgo },
      },
      _sum: { TotalAmount: true },
      _count: { _all: true },
    });

    return {
      // Prisma trả về Decimal, cần chuyển sang number để tính toán
      totalRevenue: Number(result._sum.TotalAmount || 0),
      orderCount: result._count._all,
    };
  }

  /**
   * Lấy tối đa 10 sản phẩm đang hoạt động có tồn kho thấp nhất (≤ LOW_STOCK_THRESHOLD),
   * sắp xếp theo số lượng tăng dần để ưu tiên hàng sắp hết nhất.
   */
  async getLowStockProducts(storeId: number): Promise<LowStockProduct[]> {
    const items = await this.prisma.inventory.findMany({
      where: {
        StoreID: storeId,
        Quantity: { lte: LOW_STOCK_THRESHOLD },
        product: { IsActive: true },
      },
      select: {
        Quantity: true,
        product: {
          select: { ProductName: true, SKU: true, BaseUnit: true },
        },
      },
      orderBy: { Quantity: 'asc' },
      take: 10,
    });

    return items.map((item) => ({
      productName: item.product.ProductName,
      sku: item.product.SKU,
      quantity: Number(item.Quantity),
      baseUnit: item.product.BaseUnit,
    }));
  }

  /**
   * Lấy tối đa 10 sản phẩm đang có hàng trên đường về (InTransitQty > 0).
   * "Tồn ảo" giúp chủ cửa hàng biết hàng sắp về kho để lên kế hoạch bán trước.
   */
  async getInTransitProducts(storeId: number): Promise<InTransitProduct[]> {
    const items = await this.prisma.inventory.findMany({
      where: {
        StoreID: storeId,
        InTransitQty: { gt: 0 },
      },
      select: {
        InTransitQty: true,
        Quantity: true,
        product: {
          select: { ProductName: true, SKU: true, BaseUnit: true },
        },
      },
      take: 10,
    });

    return items.map((item) => ({
      productName: item.product.ProductName,
      sku: item.product.SKU,
      inTransitQty: Number(item.InTransitQty),
      currentQty: Number(item.Quantity),
      baseUnit: item.product.BaseUnit,
    }));
  }

  /**
   * Tổng hợp công nợ khách hàng bằng cách duyệt các đơn hàng chưa thanh toán đủ.
   * Gộp nợ theo từng khách (một khách có thể có nhiều đơn nợ) và trả về top 5.
   */
  async getCustomerDebtSummary(storeId: number): Promise<CustomerDebtSummary> {
    // Lấy các đơn chưa thanh toán đủ: PaidAmount < TotalAmount (giới hạn 100 đơn gần nhất)
    const orders = await this.prisma.order.findMany({
      where: {
        StoreID: storeId,
        Status: { not: 'Cancelled' },
        CustomerID: { not: null },
        PaidAmount: { lt: this.prisma.order.fields.TotalAmount },
      },
      select: {
        TotalAmount: true,
        PaidAmount: true,
        customer: { select: { CustomerID: true, CustomerName: true } },
      },
      orderBy: { OrderDate: 'desc' },
      take: 100,
    });

    // Gộp nợ theo CustomerID để tính tổng nợ của mỗi khách
    const debtorMap = new Map<number, { customerName: string; totalDebt: number }>();

    for (const order of orders) {
      const remaining = Number(order.TotalAmount) - Number(order.PaidAmount);
      // Bỏ qua nếu đã thanh toán đủ hoặc trả dư (edge case)
      if (remaining <= 0) continue;

      const customerId = order.customer!.CustomerID;
      const existing = debtorMap.get(customerId);

      if (existing) {
        existing.totalDebt += remaining;
      } else {
        debtorMap.set(customerId, {
          customerName: order.customer!.CustomerName,
          totalDebt: remaining,
        });
      }
    }

    // Sắp xếp giảm dần theo tổng nợ
    const allDebtors = Array.from(debtorMap.values()).sort(
      (a, b) => b.totalDebt - a.totalDebt,
    );

    return {
      totalDebtAmount: allDebtors.reduce((sum, d) => sum + d.totalDebt, 0),
      debtorCount: allDebtors.length,
      topDebtors: allDebtors.slice(0, 5), // Chỉ giữ top 5 cho prompt AI
    };
  }

  /**
   * Lấy tên cửa hàng theo ID.
   * Trả về tên dự phòng nếu không tìm thấy trong DB (tránh crash AI prompt).
   */
  async getStoreName(storeId: number): Promise<string> {
    const store = await this.prisma.store.findUnique({
      where: { StoreID: storeId },
      select: { StoreName: true },
    });
    return store?.StoreName || `Cửa hàng #${storeId}`;
  }

  // ==========================================
  // PROMPT ENGINEERING (Phase 3)
  // ==========================================

  /**
   * Xây dựng prompt tiếng Việt gửi cho Gemini.
   * Định dạng dữ liệu thành văn bản có cấu trúc rõ ràng để AI dễ phân tích.
   */
  private buildAnalysisPrompt(data: StoreAnalyticsData): string {
    // Hàm tiện ích định dạng số tiền theo chuẩn Việt Nam (ví dụ: 1.500.000 VNĐ)
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';

    // Sản phẩm sắp hết hàng
    const lowStockSection =
      data.lowStockProducts.length > 0
        ? data.lowStockProducts
            .map(
              (p) =>
                `  - ${p.productName}${p.sku ? ` (${p.sku})` : ''}: còn ${p.quantity} ${p.baseUnit}`,
            )
            .join('\n')
        : '  Không có sản phẩm nào sắp hết hàng.';

    // Hàng đang về
    const inTransitSection =
      data.inTransitProducts.length > 0
        ? data.inTransitProducts
            .map(
              (p) =>
                `  - ${p.productName}: ${p.inTransitQty} ${p.baseUnit} đang về (tồn kho hiện tại: ${p.currentQty} ${p.baseUnit})`,
            )
            .join('\n')
        : '  Không có hàng đang trên đường về.';

    // Top con nợ
    const debtorsSection =
      data.customerDebt.topDebtors.length > 0
        ? data.customerDebt.topDebtors
            .map(
              (d) => `  - ${d.customerName}: nợ ${formatCurrency(d.totalDebt)}`,
            )
            .join('\n')
        : '  Không có công nợ khách hàng.';

    return `Bạn là chuyên gia cố vấn kinh doanh cho cửa hàng vật liệu xây dựng (VLXD) "${data.storeName}".

Dưới đây là dữ liệu thực tế của cửa hàng trong 30 ngày gần nhất:

📊 DOANH THU:
  - Tổng doanh thu 30 ngày qua: ${formatCurrency(data.revenue.totalRevenue)}
  - Tổng số đơn hàng: ${data.revenue.orderCount} đơn
  ${data.revenue.orderCount > 0 ? `- Giá trị trung bình mỗi đơn: ${formatCurrency(data.revenue.totalRevenue / data.revenue.orderCount)}` : ''}

📦 SẢN PHẨM SẮP HẾT HÀNG (tồn kho ≤ ${LOW_STOCK_THRESHOLD}):
${lowStockSection}

🚚 HÀNG ĐANG VỀ (tồn ảo):
${inTransitSection}

💰 CÔNG NỢ KHÁCH HÀNG:
  - Tổng công nợ cần thu: ${formatCurrency(data.customerDebt.totalDebtAmount)}
  - Số khách hàng còn nợ: ${data.customerDebt.debtorCount}
  Top khách hàng nợ nhiều nhất:
${debtorsSection}

---
Dựa trên dữ liệu trên, hãy đưa ra 3-5 lời khuyên ngắn gọn, cụ thể và có tính hành động cho chủ cửa hàng. Ưu tiên các vấn đề cấp bách nhất.

Yêu cầu:
- Trả lời bằng tiếng Việt.
- Sử dụng Markdown để format (heading, bullet points, bold).
- Chỉ phân tích dựa trên dữ liệu được cung cấp, KHÔNG bịa thêm số liệu.
- Nếu dữ liệu quá ít (ví dụ: 0 đơn hàng), hãy ghi nhận cửa hàng mới hoạt động và đưa ra lời khuyên phù hợp.`;
  }

  // ==========================================
  // AI GENERATION (Phase 4)
  // ==========================================

  /**
   * Entry point chính: trả về phân tích AI cho một cửa hàng.
   *
   * Luồng xử lý:
   * 1. Kiểm tra cache còn hạn → trả về ngay nếu có.
   * 2. Truy xuất song song 5 nguồn dữ liệu từ DB.
   * 3. Xây dựng prompt và gọi Gemini API.
   * 4. Lưu kết quả vào cache, trả về insights.
   *
   * @param storeId     ID cửa hàng cần phân tích
   * @param forceRefresh  Bỏ qua cache và buộc gọi lại API (dùng khi user nhấn "Phân tích lại")
   */
  async generateInsights(storeId: number, forceRefresh = false): Promise<{ insights: string; generatedAt: Date; cached: boolean }> {
    // Nếu API key chưa được cấu hình, trả lỗi rõ ràng thay vì crash
    if (!this.model) {
      throw new InternalServerErrorException(
        'Tính năng AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env và khởi động lại server.',
      );
    }

    // Kiểm tra cache trước – trả ngay nếu còn hiệu lực và không yêu cầu refresh
    if (!forceRefresh) {
      const cached = this.cache.get(storeId);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          insights: cached.insights,
          generatedAt: cached.generatedAt,
          cached: true,
        };
      }
    }

    // Truy xuất song song tất cả dữ liệu để giảm thời gian chờ
    const [storeName, revenue, lowStockProducts, inTransitProducts, customerDebt] =
      await Promise.all([
        this.getStoreName(storeId),
        this.getRevenueData(storeId),
        this.getLowStockProducts(storeId),
        this.getInTransitProducts(storeId),
        this.getCustomerDebtSummary(storeId),
      ]);

    const analyticsData: StoreAnalyticsData = {
      storeName,
      revenue,
      lowStockProducts,
      inTransitProducts,
      customerDebt,
    };

    const prompt = this.buildAnalysisPrompt(analyticsData);

    try {
      const result = await Promise.race([
        this.model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), GEMINI_TIMEOUT_MS),
        ),
      ]);
      const response = result.response;
      const insights = response.text();

      if (!insights || insights.trim().length === 0) {
        throw new Error('Gemini returned empty response');
      }

      const generatedAt = new Date();

      // Evict oldest entries if cache is full
      if (this.cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) this.cache.delete(oldestKey);
      }

      // Lưu vào cache để tái sử dụng trong CACHE_TTL_MS tiếp theo
      this.cache.set(storeId, {
        insights,
        generatedAt,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return { insights, generatedAt, cached: false };
    } catch (error: any) {
      this.logger.error('Gemini API call failed', error);

      // Graceful degradation: nếu API lỗi, trả cache cũ (dù đã hết hạn) thay vì báo lỗi
      const staleCache = this.cache.get(storeId);
      if (staleCache) {
        return {
          insights: staleCache.insights + '\n\n---\n> ⏳ *Dữ liệu cache từ lần phân tích trước. AI đang bị giới hạn tần suất, vui lòng thử lại sau.*',
          generatedAt: staleCache.generatedAt,
          cached: true,
        };
      }

      // Phân biệt lỗi rate limit vs lỗi khác
      const isRateLimit =
        error instanceof Error && 'status' in error && (error as Record<string, unknown>).status === 429;
      const fallbackMessage = isRateLimit
        ? '**Đã vượt giới hạn API miễn phí**\n\nBạn đã sử dụng hết quota Gemini API trong ngày. Vui lòng đợi vài phút rồi thử lại.\n\n> Mỗi lần phân tích sẽ được lưu cache 30 phút — hạn chế nhấn "Phân tích lại" liên tục để tiết kiệm quota.'
        : '**Hệ thống AI đang bận**\n\nHiện tại không thể kết nối tới dịch vụ phân tích AI. Vui lòng thử lại sau ít phút.\n\nNếu lỗi tiếp tục xảy ra, hãy liên hệ quản trị viên hệ thống.';

      return {
        insights: fallbackMessage,
        generatedAt: new Date(),
        cached: false,
      };
    }
  }
}
