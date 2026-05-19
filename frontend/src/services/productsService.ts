import api from './api';
import type {
  Product,
  ProductFilterParams,
  CreateProductDto,
  UpdateProductDto,
  ImportPreviewResponse,
  ImportCommitResponse,
  SuggestedPriceResponse,
} from '@/types';

export const productsService = {
  // Lấy danh sách sản phẩm với pagination
  getAll: async (params: ProductFilterParams = {}): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products', { params });
    return response.data;
  },

  // Lấy chi tiết sản phẩm
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Tạo sản phẩm mới
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  // Cập nhật sản phẩm
  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  // Xóa sản phẩm
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  // Tải file template Excel
  downloadTemplate: async (): Promise<void> => {
    const response = await api.get('/products/import/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Preview import (upload file, nhận kết quả phân tích)
  previewImport: async (file: File): Promise<ImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportPreviewResponse>('/products/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Commit import (upload lại file, ghi vào DB)
  commitImport: async (file: File): Promise<ImportCommitResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportCommitResponse>('/products/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Xuất danh sách sản phẩm ra file Excel
  exportProducts: async (params: ProductFilterParams = {}): Promise<void> => {
    const response = await api.get('/products/export', {
      params,
      responseType: 'blob',
    });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${timestamp}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Lấy giá bán gợi ý theo biên lợi nhuận của sản phẩm
  getSuggestedPrice: async (productId: number, unitName?: string): Promise<SuggestedPriceResponse> => {
    const response = await api.get<SuggestedPriceResponse>(`/products/${productId}/suggested-price`, {
      params: unitName ? { unitName } : undefined,
    });
    return response.data;
  },
};
