import apiClient from './api';
import type { Order, PaginatedResult, CreateOrderDto } from '@/types';

const ordersService = {
  // Tạo đơn hàng mới
  async createOrder(data: CreateOrderDto): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', {
      CustomerID: data.customerId || null,
      Note: data.note || '',
      DeliveryMethod: data.deliveryMethod || 'Immediate',
      ...(data.paidAmount !== undefined && { PaidAmount: data.paidAmount }),
      items: data.items.map(item => ({
        ProductID: item.productId,
        UnitName: item.unitName,
        Quantity: parseFloat(item.quantity),
        ...(item.unitPrice !== undefined && { UnitPrice: item.unitPrice }),
      })),
    });
    return response.data;
  },

  // Lấy danh sách đơn hàng
  async getAll(params?: { status?: string; limit?: number }): Promise<PaginatedResult<Order>> {
    const response = await apiClient.get<PaginatedResult<Order>>('/orders', { params });
    return response.data;
  },

  // Lấy chi tiết đơn hàng
  async getById(orderId: number): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);
    return response.data;
  },

  // Hoàn tất đơn đặt trước (Pending → Completed)
  async fulfillOrder(orderId: number): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${orderId}/fulfill`);
    return response.data;
  },

  // Hủy đơn hàng (Pending → Cancelled)
  async cancelOrder(orderId: number): Promise<Order & { refundAmount?: number }> {
    const response = await apiClient.patch<Order & { refundAmount?: number }>(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // Export đơn hàng ra Excel
  async exportOrders(params: Record<string, unknown> = {}): Promise<void> {
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
