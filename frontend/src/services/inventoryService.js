import apiClient from './api';

const inventoryService = {
  // Lấy danh sách tồn kho
  async getInventory(search = '', lowStockThreshold = null) {
    const params = {};
    if (search) params.search = search;
    if (lowStockThreshold !== null) params.lowStockThreshold = lowStockThreshold;
    
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  // Nhập kho (Stock-In)
  async stockIn(data) {
    const response = await apiClient.post('/inventory/stock-in', {
      supplierId: data.supplierId,
      status: data.status || 'Received',
      note: data.note,
      items: data.items.map(item => ({
        productId: item.productId,
        unitName: item.unitName,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    });
    return response.data;
  },

  // Lấy lịch sử nhập hàng của một sản phẩm
  async getProductStockHistory(productId) {
    const response = await apiClient.get(`/inventory/products/${productId}/history`);
    return response.data;
  },

  // Lấy danh sách phiếu nhập kho
  async getStockReceipts(supplierId = null) {
    const params = {};
    if (supplierId) params.supplierId = supplierId;
    const response = await apiClient.get('/inventory/receipts', { params });
    return response.data;
  },

  // Chi tiết phiếu nhập
  async getStockReceiptById(receiptId) {
    const response = await apiClient.get(`/inventory/receipts/${receiptId}`);
    return response.data;
  },

  // Xác nhận nhận hàng (Pending to Received)
  async confirmReceipt(receiptId) {
    const response = await apiClient.post(`/inventory/receipts/${receiptId}/receive`);
    return response.data;
  },

  // Giao thẳng (Direct Ship)
  async directShip(data) {
    const response = await apiClient.post('/inventory/direct-ship', {
      supplierId: data.supplierId,
      productId: data.productId,
      unitName: data.unitName,
      totalQty: parseFloat(data.totalQty),
      deliverQty: parseFloat(data.deliverQty),
      importUnitPrice: parseFloat(data.importUnitPrice),
      saleUnitPrice: parseFloat(data.saleUnitPrice),
      customerId: data.customerId || undefined,
      note: data.note || undefined,
    });
    return response.data;
  },
};

export default inventoryService;
