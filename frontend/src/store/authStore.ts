import { create } from 'zustand';
import { authService } from '../services/authService';
import { getTenantIdentifier } from '../utils/tenantPath';
import { toAuthUserMessage } from '../utils/authErrorMessage';
import type { User, StoreInfo, RegisterDto } from '@/types';

interface AuthActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  stores: StoreInfo[];
  currentStoreId: number | null;
  tenantIdentifier: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (userData: RegisterDto) => Promise<AuthActionResult>;
  logout: () => void;
  setCurrentStore: (storeIdOrObject: number | StoreInfo) => void;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  loadProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  loginWithToken: (token: string) => Promise<void>;
}

const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: JSON.parse(localStorage.getItem('user') ?? 'null') as User | null,
  token: localStorage.getItem('token'),
  stores: JSON.parse(localStorage.getItem('stores') ?? '[]') as StoreInfo[],
  currentStoreId: localStorage.getItem('currentStoreId')
    ? Number(localStorage.getItem('currentStoreId'))
    : null,
  tenantIdentifier: localStorage.getItem('tenantIdentifier'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      
      // Lưu token và user info (backend trả về access_token)
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Lưu danh sách cửa hàng nếu có (backend dùng storeId)
      if (data.stores && data.stores.length > 0) {
        const firstStore = data.stores[0] as StoreInfo;
        const tid = getTenantIdentifier(firstStore);
        localStorage.setItem('stores', JSON.stringify(data.stores));
        localStorage.setItem('currentStoreId', String(firstStore.storeId));
        localStorage.setItem('tenantIdentifier', tid);
        set({
          stores: data.stores,
          currentStoreId: firstStore.storeId,
          tenantIdentifier: tid,
        });
      }
      
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true, data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errorMessage = toAuthUserMessage(
        error.response?.data?.message,
        'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
      );
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  register: async (userData: RegisterDto) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ isLoading: false });
      return { success: true, data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const errorMessage = toAuthUserMessage(
        error.response?.data?.message,
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.',
      );
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('tenantIdentifier');
    set({
      user: null,
      token: null,
      stores: [],
      currentStoreId: null,
      tenantIdentifier: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setCurrentStore: (storeIdOrObject: number | StoreInfo) => {
    // Accept both storeId (number) or store object
    const store = typeof storeIdOrObject === 'number'
      ? get().stores.find((s) => s.storeId === storeIdOrObject)
      : storeIdOrObject;
    const storeId = store?.storeId ?? (storeIdOrObject as number);
    const tid = store ? getTenantIdentifier(store) : String(storeId);
    localStorage.setItem('currentStoreId', String(storeId));
    localStorage.setItem('tenantIdentifier', tid);
    set({ currentStoreId: storeId, tenantIdentifier: tid });
  },

  refreshAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await authService.getProfile();
      
      // Backend returns flat object: { UserID, Email, FullName, ..., stores: [...] }
      const { stores, ...userData } = data;
      const safeStores = stores ?? [];
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('stores', JSON.stringify(safeStores));

      const currentStoreId = Number(get().currentStoreId);
      const hasCurrentStore = Number.isFinite(currentStoreId) && safeStores.some((s: StoreInfo) => s.storeId === currentStoreId);
      
      let nextCurrentStoreId: number | null = null;
      let nextTenantIdentifier: string | null = null;
      if (safeStores.length > 0) {
        nextCurrentStoreId = hasCurrentStore ? currentStoreId : safeStores[0].storeId;
        localStorage.setItem('currentStoreId', String(nextCurrentStoreId));
        
        const nextStore = safeStores.find((s: StoreInfo) => s.storeId === nextCurrentStoreId);
        if (nextStore) {
          nextTenantIdentifier = getTenantIdentifier(nextStore);
          localStorage.setItem('tenantIdentifier', nextTenantIdentifier);
        } else {
          localStorage.removeItem('tenantIdentifier');
        }
      } else {
        localStorage.removeItem('currentStoreId');
        localStorage.removeItem('tenantIdentifier');
      }

      set({
        user: userData,
        stores: safeStores,
        currentStoreId: nextCurrentStoreId,
        tenantIdentifier: nextTenantIdentifier,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      // Nếu không lấy được profile, logout
      useAuthStore.getState().logout();
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  loginWithToken: async (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true, isLoading: true });
    try {
      const data = await authService.getProfile();
      const { stores, ...userData } = data;
      const safeStores: StoreInfo[] = stores ?? [];

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('stores', JSON.stringify(safeStores));

      let nextCurrentStoreId: number | null = null;
      let nextTenantIdentifier: string | null = null;
      if (safeStores.length > 0) {
        nextCurrentStoreId = safeStores[0].storeId;
        localStorage.setItem('currentStoreId', String(nextCurrentStoreId));
        
        const nextStore = safeStores[0];
        nextTenantIdentifier = getTenantIdentifier(nextStore);
        localStorage.setItem('tenantIdentifier', nextTenantIdentifier);
      } else {
        localStorage.removeItem('currentStoreId');
        localStorage.removeItem('tenantIdentifier');
      }

      set({
        user: userData,
        stores: safeStores,
        currentStoreId: nextCurrentStoreId,
        tenantIdentifier: nextTenantIdentifier,
        isLoading: false,
      });
    } catch {
      // Token invalid — undo
      localStorage.removeItem('token');
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Load user profile from token
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const data = await authService.getProfile();
      
      // Backend returns flat object: { UserID, Email, FullName, ..., stores: [...] }
      const { stores, ...userData } = data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (stores) {
        localStorage.setItem('stores', JSON.stringify(stores));
        set({ stores });
      }
      
      set({
        user: userData,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      // Nếu không lấy được profile, logout
      useAuthStore.getState().logout();
    }
  },
}));

export default useAuthStore;
