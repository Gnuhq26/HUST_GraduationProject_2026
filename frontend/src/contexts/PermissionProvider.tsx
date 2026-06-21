import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import type { Permission } from '@/types';

interface PermissionContextValue {
  permissions: Permission[];
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { stores, currentStoreId } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    const parsedStoreId = Number(currentStoreId);
    const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];

    if (!currentStore?.roleId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await authService.getMyPermissions();
      setPermissions(data);
    } catch (err: unknown) {
      console.error('Error loading permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [stores, currentStoreId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const value = useMemo(
    () => ({ permissions, loading, refreshPermissions: loadPermissions }),
    [permissions, loading, loadPermissions],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return ctx;
}

function checkPermission(permissions: Permission[], action: string, subject: string): boolean {
  const isSuperAdmin = permissions.some((p) => p.Action === 'manage' && p.Subject === 'all');
  if (isSuperAdmin) return true;
  return permissions.some((p) => p.Action === action && p.Subject === subject);
}

export function usePermissions(): { permissions: Permission[]; loading: boolean } {
  const { permissions, loading } = usePermissionContext();
  return { permissions, loading };
}

export function usePermission(action: string, subject: string): { hasPermission: boolean; loading: boolean } {
  const { permissions, loading } = usePermissionContext();
  const hasPermission = !loading && checkPermission(permissions, action, subject);
  return { hasPermission, loading };
}

export function useCanPerform(): { canPerform: (action: string, subject: string) => boolean; loading: boolean } {
  const { permissions, loading } = usePermissionContext();

  const canPerform = useCallback(
    (action: string, subject: string) => checkPermission(permissions, action, subject),
    [permissions],
  );

  return { canPerform, loading };
}
