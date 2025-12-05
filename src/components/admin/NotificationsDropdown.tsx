import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

export const NotificationsDropdown = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // جلب آخر 5 إشعارات غير مقروءة
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-dropdown', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id && isOpen,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // عدد الإشعارات غير المقروءة
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // تعليم كمقروء
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error('فشل تحديث الإشعار');
    },
  });

  // أيقونة حسب النوع
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_update':
        return '📅';
      case 'booking_approved':
        return '✅';
      case 'booking_active':
        return '🚗';
      case 'document_approved':
        return '✅';
      case 'document_rejected':
        return '❌';
      case 'document_pending':
        return '📄';
      case 'payment_received':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount || 0) > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {(unreadCount || 0) > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">الإشعارات</h3>
          <Link to="/admin/notifications">
            <Button variant="ghost" size="sm" className="text-xs">
              عرض الكل
              <ExternalLink className="h-3 w-3 mr-1" />
            </Button>
          </Link>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications?.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{notif.title_ar}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message_ar}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsReadMutation.mutate(notif.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link to="/admin/notifications">
              <Button variant="outline" size="sm" className="w-full">
                عرض جميع الإشعارات
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
