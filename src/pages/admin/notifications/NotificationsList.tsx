import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, CheckCheck, Trash2, Bell, Search, Filter, Send, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationCard } from './components/NotificationCard';
import { Link } from 'react-router-dom';

type NotificationFilter = 'all' | 'unread' | 'read';
type NotificationTypeFilter = 'all' | 'booking_update' | 'booking_approved' | 'booking_active' | 'document_approved' | 'document_rejected' | 'document_pending' | 'system';

export default function NotificationsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, filter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false});

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'read') {
        query = query.eq('is_read', true);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
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

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم بنجاح',
        description: 'تم تعليم جميع الإشعارات كمقروءة',
      });
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

  const getNotificationLink = (notification: any) => {
    const metadata = notification.metadata;
    if (!metadata) return null;

    if (notification.type.startsWith('booking') && metadata.booking_id) {
      return `/admin/bookings/${metadata.booking_id}`;
    }
    if (notification.type.startsWith('document') && metadata.document_id) {
      return `/admin/documents/${metadata.document_id}`;
    }
    return null;
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const filteredNotifications = notifications?.filter(notification => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      notification.title_ar?.toLowerCase().includes(searchLower) ||
      notification.message_ar?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الإشعارات</h1>
          <p className="text-muted-foreground mt-1">
            لديك {unreadCount} إشعار غير مقروء
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/notifications/send">
            <Button variant="default" className="gap-2">
              <Send className="h-4 w-4" />
              إرسال إشعار جديد
            </Button>
          </Link>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الإشعارات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationTypeFilter)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع الإشعار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="booking_update">تحديث حجز</SelectItem>
              <SelectItem value="booking_approved">حجز مقبول</SelectItem>
              <SelectItem value="booking_active">حجز نشط</SelectItem>
              <SelectItem value="document_pending">مستند معلق</SelectItem>
              <SelectItem value="document_approved">مستند مقبول</SelectItem>
              <SelectItem value="document_rejected">مستند مرفوض</SelectItem>
              <SelectItem value="system">نظام</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as NotificationFilter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="unread">غير مقروء ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">مقروء</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredNotifications && filteredNotifications.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">لا توجد إشعارات</h3>
                <p className="text-muted-foreground">
                  لا توجد إشعارات في هذا القسم حالياً
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {isMobile ? (
                filteredNotifications?.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                    onMarkAsUnread={() => markAsUnreadMutation.mutate(notification.id)}
                    onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                    getIcon={getNotificationIcon}
                  />
                ))
              ) : (
                filteredNotifications?.map((notification) => {
                  const link = getNotificationLink(notification);
                  return (
                    <Card
                      key={notification.id}
                      className={`p-4 transition-colors hover:bg-muted/50 ${
                        !notification.is_read ? 'border-r-4 border-r-primary' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        <span className="text-3xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{notification.title_ar}</h3>
                              <p className="text-muted-foreground mt-1">{notification.message_ar}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {link && (
                                <Link to={link}>
                                  <Button variant="ghost" size="icon" title="عرض التفاصيل">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {notification.is_read ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsUnreadMutation.mutate(notification.id)}
                                  disabled={markAsUnreadMutation.isPending}
                                  title="تعليم كغير مقروء"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                  title="تعليم كمقروء"
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                disabled={deleteNotificationMutation.isPending}
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                              {notification.is_read ? 'مقروء' : 'جديد'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
