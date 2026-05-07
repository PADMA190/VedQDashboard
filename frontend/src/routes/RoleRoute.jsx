import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RoleRoute({ allow = [], children, fallback = '/' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow.length > 0 && !allow.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

export default RoleRoute;
