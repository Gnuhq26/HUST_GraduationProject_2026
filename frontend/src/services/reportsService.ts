import apiClient from './api';

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
  async getTopProducts(startDate: string, endDate: string, sortBy = 'revenue', limit = 10) {
    const response = await apiClient.get('/reports/top-products', {
      params: { startDate, endDate, sortBy, limit },
    });
    return response.data;
  },
};

export default reportsService;
