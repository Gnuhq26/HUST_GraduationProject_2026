import apiClient from './api';
import type { Permission, PermissionGroup } from '@/types';

const permissionsService = {
  /**
   * Get all permissions
   */
  async getAll(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/permissions');
    return response.data;
  },

  /**
   * Get permissions grouped by subject
   */
  async getGrouped(): Promise<PermissionGroup[]> {
    const response = await apiClient.get<PermissionGroup[]>('/permissions/grouped');
    return response.data;
  },

  /**
   * Get permission by ID
   */
  async getById(id: number): Promise<Permission> {
    const response = await apiClient.get<Permission>(`/permissions/${id}`);
    return response.data;
  },
};

export default permissionsService;
