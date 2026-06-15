import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../config/roles';

interface RoleGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const role = useAuthStore((s) => s.user?.role);

  if (!hasPermission(role, permission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
