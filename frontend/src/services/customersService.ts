import api from './api';
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  ImportPreviewResponse,
  ImportCommitResponse,
} from '@/types';

export const customersService = {
  // Lấy danh sách customers
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  // Lấy chi tiết customer
  getById: async (id: number): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // Tạo customer mới
  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Cập nhật customer
  update: async (id: number, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await api.patch<Customer>(`/customers/${id}`, {
      CustomerName: data.CustomerName,
      Phone: data.Phone,
      Address: data.Address,
    });
    return response.data;
  },

  // Xóa customer
  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // --- Import Excel ---

  downloadTemplate: async (): Promise<void> => {
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

  previewImport: async (file: File): Promise<ImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportPreviewResponse>('/customers/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  commitImport: async (file: File): Promise<ImportCommitResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportCommitResponse>('/customers/import/commit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- Export Excel ---
  exportCustomers: async (params: Record<string, unknown> = {}): Promise<void> => {
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
