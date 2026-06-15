import type { StoreInfo } from '@/types';

/**
 * Derive the best tenant identifier for a store.
 * Priority: slugName > displayId > storeId (as string).
 */
export function getTenantIdentifier(store: StoreInfo): string {
  return store.slugName ?? store.displayId ?? String(store.storeId);
}

/**
 * Resolve a URL tenant segment to a store the user belongs to.
 * Matches slugName, displayId, or legacy numeric storeId.
 */
export function findStoreByTenantIdentifier(
  stores: StoreInfo[],
  tenant: string,
): StoreInfo | undefined {
  const normalized = tenant.toLowerCase();
  return stores.find(
    (store) =>
      store.slugName?.toLowerCase() === normalized ||
      store.displayId?.toLowerCase() === normalized ||
      String(store.storeId) === tenant,
  );
}

/**
 * Extract the in-app path suffix after /:tenant in the current pathname.
 * e.g. /abc1234/products → /products, /abc1234 → /
 */
export function extractPathAfterTenant(pathname: string, tenant: string): string {
  const prefix = `/${tenant}`;
  if (!pathname.startsWith(prefix)) return '/';
  const suffix = pathname.slice(prefix.length);
  return suffix === '' ? '/' : suffix;
}

/**
 * Build an absolute path inside the current tenant context.
 * @param tenant  The tenant identifier (slugName, displayId, etc.)
 * @param path    The app-level path (e.g. '/', '/products', '/profile')
 * @returns       The tenant-prefixed path (e.g. '/hung-phat/products')
 */
export function tenantPath(tenant: string, path: string): string {
  if (path === '/') return `/${tenant}`;
  // Ensure no double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${tenant}${cleanPath}`;
}
