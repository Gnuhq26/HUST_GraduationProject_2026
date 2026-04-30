import apiClient from './api';
import type {
  Inventory,
  StockReceipt,
  StockInDto,
  DirectShipDto,
  ImportPreviewResponse,
  ImportCommitResponse,
} from '@/types';

const inventoryService = {
  // Lấy danh sách tồn kho
  async getInventory(search = '', lowStockThreshold: number | null = null): Promise<Inventory[]> {
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (lowStockThreshold !== null) params.lowStockThreshold = lowStockThreshold;
    
    const response = await apiClient.get<Inventory[]>('/inventory', { params });
    return response.data;
  },

  // Nhập kho (Stock-In)
  async stockIn(data: StockInDto): Promise<StockReceipt> {
    const response = await apiClient.post<StockReceipt>('/inventory/stock-in', {
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
  async getProductStockHistory(productId: number) {
    const response = await apiClient.get(`/inventory/products/${productId}/history`);
    return response.data;
  },

  // Lấy danh sách phiếu nhập kho
  async getStockReceipts(supplierId: number | null = null): Promise<StockReceipt[]> {
    const params: Record<string, unknown> = {};
    if (supplierId) params.supplierId = supplierId;
    const response = await apiClient.get<StockReceipt[]>('/inventory/receipts', { params });
    return response.data;
  },

  // Chi tiết phiếu nhập
  async getStockReceiptById(receiptId: number): Promise<StockReceipt> {
    const response = await apiClient.get<StockReceipt>(`/inventory/receipts/${receiptId}`);
    return response.data;
  },

  // Xác nhận nhận hàng (Pending to Received)
  async confirmReceipt(receiptId: number): Promise<StockReceipt> {
    const response = await apiClient.post<StockReceipt>(`/inventory/receipts/${receiptId}/receive`);
    return response.data;
  },

  // Giao thẳng (Direct Ship)
  async directShip(data: DirectShipDto) {
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

  // --- Import Excel ---

  async downloadTemplate(): Promise<void> {
    const response = await apiClient.get('/inventory/import/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async previewImport(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ImportPreviewResponse>('/inventory/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async commitImport(file: File): Promise<ImportCommitResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ImportCommitResponse>('/inventory/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Export tồn kho ra Excel
  async exportInventory(params: Record<string, unknown> = {}): Promise<void> {
    const response = await apiClient.get('/inventory/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `ton-kho-${timestamp}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default inventoryService;
