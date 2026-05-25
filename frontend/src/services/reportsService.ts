import apiClient from './api';
import type { TopProductsReportResponse, RevenueByCategoryReportResponse, VirtualInventoryTrendResponse, MonthlyRevenueResponse } from '../types/models';

const reportsService = {
  // Báo cáo doanh thu
  async getRevenueReport(startDate: string, endDate: string) {
    const response = await apiClient.get('/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Báo cáo lợi nhuận
  async getProfitReport(startDate: string, endDate: string) {
    const response = await apiClient.get('/reports/profit', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Top sản phẩm bán chạy
  async getTopProducts( startDate: string, endDate: string, sortBy = 'revenue', limit = 10, ): Promise<TopProductsReportResponse> {
    const response = await apiClient.get('/reports/top-products', {
      params: { startDate, endDate, sortBy, limit },
    });
    return response.data;
  },

  // Doanh thu theo danh mục (PieChart)
  async getRevenueByCategoryReport(
    startDate: string,
    endDate: string,
  ): Promise<RevenueByCategoryReportResponse> {
    const response = await apiClient.get('/reports/revenue-by-category', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Xu hướng tồn kho ảo (AreaChart)
  async getVirtualInventoryTrend(
    startDate: string,
    endDate: string,
  ): Promise<VirtualInventoryTrendResponse> {
    const response = await apiClient.get('/reports/virtual-inventory-trend', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Doanh thu theo tháng trong năm (Analytics Bar Chart)
  async getMonthlyRevenue(year?: number): Promise<MonthlyRevenueResponse> {
    const response = await apiClient.get('/reports/monthly-revenue', {
      params: year ? { year } : {},
    });
    return response.data;
  },
};

export default reportsService;
