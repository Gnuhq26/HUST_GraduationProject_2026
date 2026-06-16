import apiClient from './api';
import type { Store, StoreUser, CreateStoreDto, AddMemberDto, UpdateStoreDto } from '@/types';

const storesService = {
  /**
   * Create a new store
   */
  async createStore(data: CreateStoreDto): Promise<Store> {
    const response = await apiClient.post<Store>('/stores', data);
    return response.data;
  },

  /**
   * Get current store details
   */
  async getStoreDetails(): Promise<Store> {
    const response = await apiClient.get<Store>('/stores/details');
    return response.data;
  },

  async updateStore(data: UpdateStoreDto): Promise<Store> {
    const response = await apiClient.patch<Store>('/stores/details', data);
    return response.data;
  },

  /**
   * Get all members of current store
   */
  async getMembers(): Promise<StoreUser[]> {
    const response = await apiClient.get<StoreUser[]>('/stores/members');
    return response.data;
  },

  /**
   * Add a member to the store.
   * Returns `temporaryPassword` when a new user account was created.
   */
  async addMember(data: AddMemberDto): Promise<{ message: string; member: StoreUser; temporaryPassword?: string }> {
    const response = await apiClient.post<{ message: string; member: StoreUser; temporaryPassword?: string }>('/stores/members', data);
    return response.data;
  },

  /**
   * Update member role
   */
  async updateMemberRole(userId: number, roleId: number): Promise<StoreUser> {
    const response = await apiClient.put<StoreUser>(`/stores/members/${userId}/role`, {
      roleId,
    });
    return response.data;
  },

  /**
   * Remove a member from store
   */
  async removeMember(userId: number) {
    const response = await apiClient.delete(`/stores/members/${userId}`);
    return response.data;
  },
};

export default storesService;
