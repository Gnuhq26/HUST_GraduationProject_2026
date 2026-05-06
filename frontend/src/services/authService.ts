import api from './api';
import type { User, Permission, LoginResponse, RegisterDto, ProfileResponse } from '@/types';

export const authService = {
  // Đăng nhập
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  // Đăng ký
  register: async (userData: RegisterDto): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  // Lấy thông tin user hiện tại
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },

  // Lấy quyền hiện tại của user theo store đang chọn
  getMyPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/auth/permissions');
    return response.data;
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (dto: {
    fullName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> => {
    const response = await api.patch<User>('/auth/profile', dto);
    return response.data;
  },

  // Đăng xuất (client-side)
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
  },
};
