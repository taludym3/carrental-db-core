import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Trash2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationCard } from './components/NotificationCard';

type NotificationFilter = 'all' | 'unread' | 'read';

export default function NotificationsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'read') {
        query = query.eq('is_read', true);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإشعار بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-dropdown'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_update':
        return '📅';
      case 'document_approved':
        return '✅';
      case 'document_rejected':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">الإشعارات</h1>
        <p className="text-muted-foreground mt-1">
          عرض وإدارة جميع الإشعارات
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)}>
        <TabsList>
          <TabsTrigger value="all">
            الكل {notifications && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            غير المقروءة {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="read">المقروءة</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : notifications?.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">لا توجد إشعارات</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'جميع الإشعارات مقروءة' 
                  : filter === 'read'
                  ? 'لا توجد إشعارات مقروءة'
                  : 'لا توجد إشعارات حتى الآن'}
              </p>
            </Card>
          ) : isMobile ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                  onMarkAsUnread={() => markAsUnreadMutation.mutate(notification.id)}
                  onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                  getIcon={getNotificationIcon}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 ${!notification.is_read ? 'bg-muted/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{getNotificationIcon(notification.type)}</span>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">{notification.title_ar}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message_ar}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge variant="default" className="shrink-0">جديد</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.is_read ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsUnreadMutation.mutate(notification.id)}
                          disabled={markAsUnreadMutation.isPending}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
