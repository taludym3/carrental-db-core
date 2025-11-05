import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationCard } from '@/pages/admin/notifications/components/NotificationCard';

const BranchNotificationsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['branch-notifications', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'unread') {
        query = query.eq('is_read', false);
      } else if (activeTab === 'read') {
        query = query.eq('is_read', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-notifications'] });
      toast.success('تم تعليم الإشعار كمقروء');
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
      queryClient.invalidateQueries({ queryKey: ['branch-notifications'] });
      toast.success('تم تعليم جميع الإشعارات كمقروءة');
    },
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإشعارات</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 && `لديك ${unreadCount} إشعار غير مقروء`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 ml-2" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Bell className="h-4 w-4 ml-2" />
            الكل
          </TabsTrigger>
          <TabsTrigger value="unread">
            غير المقروءة
            {unreadCount > 0 && (
              <span className="mr-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">
            <Check className="h-4 w-4 ml-2" />
            المقروءة
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !notifications?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد إشعارات</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                onMarkAsUnread={() => {}}
                onDelete={() => {}}
                getIcon={() => 'Bell'}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchNotificationsList;
