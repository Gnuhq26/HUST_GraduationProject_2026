import type { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

interface ProtectedActionProps {
  action: string;
  subject: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to protect UI elements based on permissions
 * Hides children if user doesn't have required permission
 */
export default function ProtectedAction({ action, subject, children, fallback = null }: ProtectedActionProps) {
  const { hasPermission, loading } = usePermission(action, subject);

  if (loading) {
    return fallback;
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
