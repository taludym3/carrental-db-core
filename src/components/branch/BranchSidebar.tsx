import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Bell,
  Users,
  ChevronRight,
  BarChart3,
  Settings,
  UserCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuItems = [
  { title: 'لوحة التحكم', icon: LayoutDashboard, path: '/branch' },
  { title: 'السيارات', icon: Car, path: '/branch/cars' },
  { title: 'الحجوزات', icon: Calendar, path: '/branch/bookings' },
  { title: 'الموظفين', icon: Users, path: '/branch/staff' },
  { title: 'التقارير', icon: BarChart3, path: '/branch/reports' },
  { title: 'الإشعارات', icon: Bell, path: '/branch/notifications' },
  { title: 'الملف الشخصي', icon: UserCircle, path: '/branch/profile' },
  { title: 'الإعدادات', icon: Settings, path: '/branch/settings' },
];

interface BranchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchSidebar = ({ isOpen, onClose }: BranchSidebarProps) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="text-xl font-bold">LEAGO</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/branch'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 font-medium">{item.title}</span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};
