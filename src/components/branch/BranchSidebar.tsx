import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Bell,
  Users,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'لوحة التحكم', icon: LayoutDashboard, path: '/branch' },
  { title: 'السيارات', icon: Car, path: '/branch/cars' },
  { title: 'الحجوزات', icon: Calendar, path: '/branch/bookings' },
  { title: 'الموظفين', icon: Users, path: '/branch/staff' },
  { title: 'التقارير', icon: BarChart3, path: '/branch/reports' },
  { title: 'الإشعارات', icon: Bell, path: '/branch/notifications' },
];

export const BranchSidebar = () => {
  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] bg-card border-l border-border">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/branch'}
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
    </aside>
  );
};
