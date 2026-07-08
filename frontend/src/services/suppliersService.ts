import apiClient from './api';
import type {
  Supplier,
  PaginatedResult,
  CreateSupplierDto,
  UpdateSupplierDto,
  ImportPreviewResponse,
  ImportCommitResponse,
} from '@/types';

const suppliersService = {
  // Lấy danh sách nhà cung cấp (có thể tìm kiếm) — trả về mảng đầy đủ cho dropdown
  async getAll(search = ''): Promise<Supplier[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get<PaginatedResult<Supplier>>('/suppliers', { params });
    return response.data.data;
  },

  // Lấy danh sách nhà cung cấp có phân trang (search + page phía server)
  async getPaginated(
    params?: { search?: string; page?: number; limit?: number },
  ): Promise<PaginatedResult<Supplier>> {
    const response = await apiClient.get<PaginatedResult<Supplier>>('/suppliers', { params });
    return response.data;
  },

  // Lấy chi tiết nhà cung cấp
  async getById(id: number): Promise<Supplier> {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  // Tạo nhà cung cấp mới
  async create(data: CreateSupplierDto): Promise<Supplier> {
    const response = await apiClient.post<Supplier>('/suppliers', {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Cập nhật nhà cung cấp
  async update(id: number, data: UpdateSupplierDto): Promise<Supplier> {
    const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, {
      supplierName: data.SupplierName,
      phone: data.Phone,
      address: data.Address,
    });
    return response.data;
  },

  // Xóa nhà cung cấp
  async delete(id: number) {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  async downloadTemplate(): Promise<void> {
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

  async previewImport(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ImportPreviewResponse>('/suppliers/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async commitImport(file: File): Promise<ImportCommitResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ImportCommitResponse>('/suppliers/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- Export Excel ---
  async exportSuppliers(params: Record<string, unknown> = {}): Promise<void> {
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
