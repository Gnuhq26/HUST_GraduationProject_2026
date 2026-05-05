import api from './api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

export const categoriesService = {
  // Lấy danh sách categories
  getAll: async (search = ''): Promise<Category[]> => {
    const params = search ? { search } : {};
    const response = await api.get<Category[]>('/categories', { params });
    return response.data;
  },

  // Lấy chi tiết category
  getById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  // Tạo category mới
  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>('/categories', {
      categoryName: data.CategoryName,
      description: data.Description,
    });
    return response.data;
  },

  // Cập nhật category
  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.patch<Category>(`/categories/${id}`, {
      categoryName: data.CategoryName,
      description: data.Description,
    });
    return response.data;
  },

  // Xóa category
  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
