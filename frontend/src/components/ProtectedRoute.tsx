// frontend/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireCustomer = false }: ProtectedRouteProps) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireCustomer && user?.role !== 'customer') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;