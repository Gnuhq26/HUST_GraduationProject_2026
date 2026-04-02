/** Dữ liệu doanh thu của cửa hàng trong 30 ngày gần nhất */
export interface RevenueData {
  totalRevenue: number; /** Tổng doanh thu (VNĐ) từ các đơn không bị hủy */
  orderCount: number; /** Tổng số đơn hàng đã tạo */
}

/** Sản phẩm có tồn kho thấp (≤ LOW_STOCK_THRESHOLD) */
export interface LowStockProduct {
  productName: string;
  sku: string | null; /** Mã SKU, có thể null nếu chưa được thiết lập */
  quantity: number; /** Số lượng tồn kho hiện tại */
  baseUnit: string; /** Đơn vị tính cơ bản (ví dụ: "cái", "kg") */
}

/** Sản phẩm đang trên đường về (tồn ảo – InTransitQty > 0) */
export interface InTransitProduct {
  productName: string;
  sku: string | null;
  inTransitQty: number; /** Số lượng đang trên đường về (tồn ảo) */
  currentQty: number; /** Số lượng tồn kho hiện tại */
  baseUnit: string;
}

/** Thông tin một khách hàng còn nợ */
export interface DebtorInfo {
  customerName: string;
  totalDebt: number; /** Tổng công nợ còn lại (VNĐ) */
}

/** Tổng hợp công nợ khách hàng của cửa hàng */
export interface CustomerDebtSummary {
  totalDebtAmount: number; /** Tổng số tiền công nợ còn lại của tất cả khách hàng (VNĐ) */
  debtorCount: number; /** Số lượng khách hàng đang còn nợ */
  topDebtors: DebtorInfo[]; /** Danh sách top 5 khách hàng nợ nhiều nhất */
}

/** Toàn bộ dữ liệu phân tích được gửi vào prompt AI */
export interface StoreAnalyticsData {
  storeName: string;
  revenue: RevenueData;
  lowStockProducts: LowStockProduct[];
  inTransitProducts: InTransitProduct[];
  customerDebt: CustomerDebtSummary;
}
