import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type UserRole = 'admin' | 'branch' | 'branch_employee' | 'customer';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // توجيه للصفحة المناسبة حسب الدور
    switch(role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'branch':
      case 'branch_employee':
        return <Navigate to="/branch" replace />;
      case 'customer':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
