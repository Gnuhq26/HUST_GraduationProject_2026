import apiClient from './api';

const debtsService = {
  // Lấy danh sách công nợ khách hàng
  async getCustomerDebts() {
    const response = await apiClient.get('/debts/customers');
    return response.data;
  },

  // Lấy danh sách công nợ nhà cung cấp
  async getSupplierDebts() {
    const response = await apiClient.get('/debts/suppliers');
    return response.data;
  },

  // Ghi nhận thanh toán
  async recordPayment(data) {
    const response = await apiClient.post('/debts/payment', {
      type: data.type,
      referenceId: data.referenceId,
      amount: parseFloat(data.amount),
      note: data.note || undefined,
    });
    return response.data;
  },
};

export default debtsService;
