import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const RoleBasedRedirect = () => {
  const { role, loading } = useAuth();

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

  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'branch':
    case 'branch_employee':
      return <Navigate to="/branch" replace />;
    case 'customer':
      return <Navigate to="/customer" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};
