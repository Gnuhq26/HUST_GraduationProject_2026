import apiClient from './api';
import type { Role, Permission, CreateRoleDto, UpdateRoleDto } from '@/types';

const rolesService = {
  /**
   * Get all roles in current store
   */
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data;
  },

  /**
   * Get role by ID
   */
  async getById(id: number): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Create a new role
   */
  async create(data: CreateRoleDto): Promise<Role> {
    const response = await apiClient.post<Role>('/roles', {
      roleName: data.roleName,
      description: data.description,
    });
    return response.data;
  },

  /**
   * Update a role
   */
  async update(id: number, data: UpdateRoleDto): Promise<Role> {
    const response = await apiClient.put<Role>(`/roles/${id}`, {
      roleName: data.roleName,
      description: data.description,
    });
    return response.data;
  },

  /**
   * Delete a role
   */
  async delete(id: number) {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    const response = await apiClient.post<Role>(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  },

  /**
   * Get permissions of a role
   */
  async getPermissions(roleId: number): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>(`/roles/${roleId}/permissions`);
    return response.data;
  },
};

export default rolesService;
