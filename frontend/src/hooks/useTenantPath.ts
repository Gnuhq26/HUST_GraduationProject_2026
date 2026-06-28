import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { tenantPath } from '../utils/tenantPath';

/**
 * Build tenant-prefixed in-app paths from the current /:tenant route segment.
 * Use for Link/navigate inside MainLayout (Dashboard, Header, charts, …).
 */
export function useTenantPath(): (path: string) => string {
  const { tenant } = useParams<{ tenant: string }>();

  return useCallback(
    (path: string) => (tenant ? tenantPath(tenant, path) : path),
    [tenant],
  );
}
