import api from './api';

export const productsService = {
  // Lấy danh sách sản phẩm với pagination
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Lấy chi tiết sản phẩm
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Tạo sản phẩm mới
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Cập nhật sản phẩm
  update: async (id, data) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  // Xóa sản phẩm
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  // Tải file template Excel
  downloadTemplate: async () => {
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
  previewImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Commit import (upload lại file, ghi vào DB)
  commitImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
