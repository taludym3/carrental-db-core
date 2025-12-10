import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UserRole = 'admin' | 'branch' | 'branch_employee' | 'customer';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  const [roleCheckTimeout, setRoleCheckTimeout] = useState(false);

  // Timeout بعد 8 ثواني إذا لم يتم جلب الدور
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (user && role === null && !loading) {
      timer = setTimeout(() => {
        setRoleCheckTimeout(true);
      }, 8000);
    }
    
    // إعادة تعيين الـ timeout عند تغيير الحالة
    if (role !== null) {
      setRoleCheckTimeout(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, role, loading]);

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

  if (allowedRoles) {
    // إذا انتهى الوقت ولم يتم جلب الدور
    if (roleCheckTimeout && role === null) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">حدث خطأ في التحقق من الصلاحيات</p>
            <p className="text-muted-foreground text-sm">يرجى إعادة المحاولة</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    // إذا لم يتم جلب الدور بعد، اعرض شاشة تحميل
    if (role === null) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
          </div>
        </div>
      );
    }
    
    // إذا الدور غير مسموح، وجه للصفحة المناسبة
    if (!allowedRoles.includes(role)) {
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
  }

  return <>{children}</>;
};
