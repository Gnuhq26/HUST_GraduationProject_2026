import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCanPerform } from '../hooks/usePermission';

interface PermissionSpec {
  action: string;
  subject: string;
}

interface PermissionRouteProps {
  /** Single permission check (default mode). */
  action?: string;
  subject?: string;
  /** OR-mode: user needs at least one of these permissions. */
  anyOf?: PermissionSpec[];
  children: ReactNode;
}

export default function PermissionRoute({ action, subject, anyOf, children }: PermissionRouteProps) {
  const { canPerform, loading } = useCanPerform();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (anyOf?.length) {
    const hasAnyPermission = anyOf.some((p) => canPerform(p.action, p.subject));
    if (!hasAnyPermission) {
      return <Navigate to="/forbidden" replace />;
    }
    return children;
  }

  if (!action || !subject || !canPerform(action, subject)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
