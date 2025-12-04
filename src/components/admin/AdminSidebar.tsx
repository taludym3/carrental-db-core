import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Car,
  Tag,
  Palette,
  PaintBucket,
  FileText,
  Calendar,
  CreditCard,
  Megaphone,
  Wrench,
  Bell,
  BarChart3,
  X,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", href: "/admin" },
  { icon: Users, label: "المستخدمين", href: "/admin/users" },
  { icon: Building2, label: "الفروع", href: "/admin/branches" },
  { icon: Car, label: "السيارات", href: "/admin/cars" },
  { icon: Tag, label: "العلامات التجارية", href: "/admin/brands" },
  { icon: Palette, label: "الموديلات", href: "/admin/models" },
  { icon: PaintBucket, label: "الألوان", href: "/admin/colors" },
  { icon: Wrench, label: "المميزات", href: "/admin/features" },
  { icon: FileText, label: "الوثائق", href: "/admin/documents" },
  { icon: Calendar, label: "الحجوزات", href: "/admin/bookings" },
  { icon: Megaphone, label: "الإعلانات", href: "/admin/announcements" },
  { icon: CreditCard, label: "المدفوعات", href: "/admin/payments" },
  { icon: Bell, label: "الإشعارات", href: "/admin/notifications" },
  { icon: BarChart3, label: "التقارير", href: "/admin/reports" },
  { icon: UserCircle, label: "الملف الشخصي", href: "/admin/profile" },
];

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();

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
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};
