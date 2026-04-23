import apiClient from './api';

const suppliersService = {
  // Lấy danh sách nhà cung cấp (có thể tìm kiếm)
  async getAll(search = '') {
    const params = search ? { search } : {};
    const response = await apiClient.get('/suppliers', { params });
    return response.data;
  },

  // Lấy chi tiết nhà cung cấp
  async getById(id) {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data;
  },

  // Tạo nhà cung cấp mới
  async create(data) {
    const response = await apiClient.post('/suppliers', {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Cập nhật nhà cung cấp
  async update(id, data) {
    const response = await apiClient.patch(`/suppliers/${id}`, {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Xóa nhà cung cấp
  async delete(id) {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  async downloadTemplate() {
    const response = await apiClient.get('/suppliers/import/template', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-import-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async previewImport(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/suppliers/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async commitImport(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/suppliers/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- Export Excel ---
  async exportSuppliers(params = {}) {
    const response = await apiClient.get('/suppliers/export', {
      params,
      responseType: 'blob',
    });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-export-${timestamp}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export default suppliersService;
