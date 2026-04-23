import api from './api';

export const customersService = {
  // Lấy danh sách customers
  getAll: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Lấy chi tiết customer
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Tạo customer mới
  create: async (data) => {
    const response = await api.post('/customers', {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Cập nhật customer
  update: async (id, data) => {
    const response = await api.patch(`/customers/${id}`, {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Xóa customer
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  downloadTemplate: async () => {
    const response = await api.get('/customers/import/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-import-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  previewImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customers/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  commitImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customers/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- Export Excel ---
  exportCustomers: async (params = {}) => {
    const response = await api.get('/customers/export', {
      params,
      responseType: 'blob',
    });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${timestamp}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
