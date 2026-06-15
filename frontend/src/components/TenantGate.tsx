import { useEffect, useState, type ReactNode } from 'react';
import useAuthStore from '../store/authStore';
import { useTenantSync } from '../hooks/useTenantSync';

interface TenantGateProps {
  children: ReactNode;
}

/** True when any store is missing path-based identifiers (stale localStorage). */
function storesNeedRefresh(stores: { displayId: string | null; slugName: string | null }[]): boolean {
  return stores.some((s) => !s.displayId && !s.slugName);
}

/**
 * Blocks tenant-scoped UI until store metadata and URL context are synchronised.
 * Refreshes profile once on mount when cached stores lack DisplayId (e.g. after DB backfill).
 */
export default function TenantGate({ children }: TenantGateProps) {
  const refreshAuth = useAuthStore((s) => s.refreshAuth);
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      if (storesNeedRefresh(useAuthStore.getState().stores)) {
        try {
          await refreshAuth();
        } catch {
          /* refreshAuth logs out on hard failure */
        }
      }
      if (active) setStoresReady(true);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [refreshAuth]);

  const phase = useTenantSync(storesReady);

  if (!storesReady || phase !== 'ready') {
    return (
      <div className="flex flex-col h-screen bg-basic-white items-center justify-center">
        <div className="text-blacky-500 text-sm">Đang tải cửa hàng...</div>
      </div>
    );
  }

  return <>{children}</>;
}
