import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LogOut, User, Plus, Calendar, BarChart3, Settings, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationsDropdown } from '../admin/NotificationsDropdown';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface BranchHeaderProps {
  onMenuClick: () => void;
}

export const BranchHeader = ({ onMenuClick }: BranchHeaderProps) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['branch-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, branch_id, branches(name_ar)')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    const email = user?.email || '';
    return email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    return profile?.full_name || user?.email || 'مستخدم';
  };

  const getRoleLabel = () => {
    if (role === 'branch') return 'مدير الفرع';
    if (role === 'branch_employee') return 'موظف الفرع';
    return 'مستخدم';
  };

  const getBranchName = () => {
    return profile?.branches?.name_ar || 'الفرع';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium hidden sm:inline-block">{getBranchName()}</span>
      </div>

      <div className="flex-1" />

      <NotificationsDropdown />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex md:flex-col md:items-start md:gap-0">
              <span className="text-sm font-medium">{getUserDisplayName()}</span>
              <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>حسابي</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/branch/profile')}>
            <User className="ml-2 h-4 w-4" />
            <span>الملف الشخصي</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>إجراءات سريعة</DropdownMenuLabel>
          
          {role === 'branch' && (
            <DropdownMenuItem onClick={() => navigate('/branch/cars/add')}>
              <Plus className="ml-2 h-4 w-4" />
              <span>إضافة سيارة</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => navigate('/branch/bookings')}>
            <Calendar className="ml-2 h-4 w-4" />
            <span>الحجوزات</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/branch/reports')}>
            <BarChart3 className="ml-2 h-4 w-4" />
            <span>التقارير</span>
          </DropdownMenuItem>
          
          {role === 'branch' && (
            <DropdownMenuItem onClick={() => navigate('/branch/settings')}>
              <Settings className="ml-2 h-4 w-4" />
              <span>إعدادات الفرع</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="ml-2 h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
