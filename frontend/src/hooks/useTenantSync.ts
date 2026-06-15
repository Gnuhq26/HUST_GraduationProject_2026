import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  extractPathAfterTenant,
  findStoreByTenantIdentifier,
  getTenantIdentifier,
  tenantPath,
} from '../utils/tenantPath';

export type TenantSyncPhase = 'loading' | 'ready';

/**
 * Synchronises the URL tenant segment (/:tenant/...) with authStore + localStorage.
 *
 * - Resolves :tenant → store the user belongs to
 * - Redirects unknown tenants → /forbidden
 * - Redirects canonical slug when URL uses displayId (or legacy storeId)
 * - Updates currentStoreId + tenantIdentifier before API calls run
 * - Reloads when the active store changes via URL (same as Header store switch)
 */
export function useTenantSync(storesReady: boolean): TenantSyncPhase {
  const { tenant } = useParams<{ tenant: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stores = useAuthStore((s) => s.stores);
  const currentStoreId = useAuthStore((s) => s.currentStoreId);
  const tenantIdentifier = useAuthStore((s) => s.tenantIdentifier);
  const setCurrentStore = useAuthStore((s) => s.setCurrentStore);

  const [phase, setPhase] = useState<TenantSyncPhase>('loading');
  const prevTenantRef = useRef<string | undefined>(tenant);

  useLayoutEffect(() => {
    if (!storesReady) return;

    if (prevTenantRef.current !== tenant) {
      setPhase('loading');
      prevTenantRef.current = tenant;
    }

    if (!tenant) {
      navigate('/select-store', { replace: true });
      return;
    }

    if (stores.length === 0) {
      navigate('/no-store', { replace: true });
      return;
    }

    const store = findStoreByTenantIdentifier(stores, tenant);
    if (!store) {
      navigate('/forbidden', { replace: true });
      return;
    }

    const canonicalTenant = getTenantIdentifier(store);
    const pathSuffix = extractPathAfterTenant(location.pathname, tenant);

    // Prefer branded/canonical URL (slug > displayId > storeId)
    if (tenant !== canonicalTenant) {
      const target =
        tenantPath(canonicalTenant, pathSuffix) + location.search + location.hash;
      navigate(target, { replace: true });
      return;
    }

    const storeChanged =
      currentStoreId !== null && currentStoreId !== store.storeId;
    const contextStale =
      currentStoreId !== store.storeId || tenantIdentifier !== canonicalTenant;

    if (contextStale) {
      setCurrentStore(store);
    }

    // Hard reload when switching stores via URL so page data matches new context
    if (storeChanged) {
      window.location.assign(
        tenantPath(canonicalTenant, pathSuffix) + location.search + location.hash,
      );
      return;
    }

    setPhase('ready');
  }, [
    storesReady,
    tenant,
    stores,
    currentStoreId,
    tenantIdentifier,
    location.pathname,
    location.search,
    location.hash,
    navigate,
    setCurrentStore,
  ]);

  if (!storesReady) return 'loading';
  return phase;
}
