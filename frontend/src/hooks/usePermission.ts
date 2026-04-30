import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import type { Permission } from '@/types';

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(action: string, subject: string): { hasPermission: boolean; loading: boolean } {
  const { stores, currentStoreId } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      
      // Find current store
      const parsedStoreId = Number(currentStoreId);
      const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];
      
      if (!currentStore || !currentStore.roleId) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        // Get effective permissions of current user in selected store
        const permissions = await authService.getMyPermissions();
        
        // Check for super admin permission (manage all)
        const isSuperAdmin = permissions.some(
          (p: Permission) => p.Action === 'manage' && p.Subject === 'all'
        );
        
        if (isSuperAdmin) {
          setHasPermission(true);
          setLoading(false);
          return;
        }
        
        // Check for specific permission
        const hasSpecificPermission = permissions.some(
          (p: Permission) => p.Action === action && p.Subject === subject
        );
        
        setHasPermission(hasSpecificPermission);
      } catch (err: unknown) {
        console.error('Error checking permission:', err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [action, subject, stores, currentStoreId]);

  return { hasPermission, loading };
}

/**
 * Hook to get all permissions of current user
 */
export function usePermissions(): { permissions: Permission[]; loading: boolean } {
  const { stores, currentStoreId } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      
      // Find current store
      const parsedStoreId = Number(currentStoreId);
      const currentStore = stores.find((s) => s.storeId === parsedStoreId) || stores[0];
      
      if (!currentStore || !currentStore.roleId) {
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

/**
 * Hook to check if current user can perform an action.
 * Similar to usePermission but returns a function.
 */
export function useCanPerform(): { canPerform: (action: string, subject: string) => boolean; loading: boolean } {
  const { permissions, loading } = usePermissions();

  const canPerform = (action: string, subject: string): boolean => {
    if (loading) return false;
    
    // Check for super admin permission
    const isSuperAdmin = permissions.some(
      (p: Permission) => p.Action === 'manage' && p.Subject === 'all'
    );
    
    if (isSuperAdmin) return true;
    
    // Check for specific permission
    return permissions.some(
      (p: Permission) => p.Action === action && p.Subject === subject
    );
  };

  return { canPerform, loading };
}
