import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import type { Permission } from '@/types';

/**
 * @deprecated Import from '../contexts/PermissionProvider' instead.
 * Kept as re-export for backward compatibility.
 */
export {
  usePermission,
  usePermissions,
  useCanPerform,
} from '../contexts/PermissionProvider';

/** Standalone hook for pages outside PermissionProvider (login, etc.). */
export function usePermissionsStandalone(): { permissions: Permission[]; loading: boolean } {
  const { stores, currentStoreId } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      const parsedStoreId = Number(currentStoreId);
      const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];

      if (!currentStore?.roleId) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const rolePermissions = await authService.getMyPermissions();
        setPermissions(rolePermissions);
      } catch (err: unknown) {
        console.error('Error loading permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [stores, currentStoreId]);

  return { permissions, loading };
}
