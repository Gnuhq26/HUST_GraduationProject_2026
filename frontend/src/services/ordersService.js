import apiClient from './api';

const ordersService = {
  // Tạo đơn hàng mới
  async createOrder(data) {
    const response = await apiClient.post('/orders', {
      CustomerID: data.customerId || null,
      Note: data.note || '',
      DeliveryMethod: data.deliveryMethod || 'Immediate',
      items: data.items.map(item => ({
        ProductID: item.productId,
        UnitName: item.unitName,
        Quantity: parseFloat(item.quantity),
      })),
    });
    return response.data;
  },

  // Lấy danh sách đơn hàng
  async getAll() {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  async getById(orderId) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  // Hoàn tất đơn đặt trước (Pending → Completed)
  async fulfillOrder(orderId) {
    const response = await apiClient.patch(`/orders/${orderId}/fulfill`);
    return response.data;
  },

  // Hủy đơn hàng (Pending → Cancelled)
  async cancelOrder(orderId) {
    const response = await apiClient.patch(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Export đơn hàng ra Excel
  async exportOrders(params = {}) {
    const response = await apiClient.get('/orders/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `don-hang-${timestamp}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default ordersService;
