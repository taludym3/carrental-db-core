import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Send, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type RecipientType = 'all' | 'role' | 'user';
type NotificationType = 'info' | 'booking_update' | 'document_approved' | 'document_rejected' | 'system';

export default function NotificationsSend() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState<NotificationType>('info');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all users
  const { data: users } = useQuery({
    queryKey: ['users-for-notifications'],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('role');
      
      if (rolesError) throw rolesError;

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', rolesData?.map(r => r.user_id) || []);
      
      if (profilesError) throw profilesError;

      // Combine the data
      const combined = rolesData?.map(role => ({
        ...role,
        full_name: profilesData?.find(p => p.user_id === role.user_id)?.full_name || null
      })) || [];
      
      return combined;
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      let recipientIds: string[] = [];

      // Determine recipients
      if (recipientType === 'all') {
        recipientIds = users?.map(u => u.user_id) || [];
      } else if (recipientType === 'role' && selectedRole) {
        recipientIds = users?.filter(u => u.role === selectedRole).map(u => u.user_id) || [];
      } else if (recipientType === 'user') {
        recipientIds = selectedUsers;
      }

      if (recipientIds.length === 0) {
        throw new Error('لم يتم تحديد مستلمين');
      }

      // Send notifications to all recipients
      const notifications = recipientIds.map(recipientId => ({
        user_id: recipientId,
        title_ar: titleAr,
        title_en: titleEn,
        message_ar: messageAr,
        message_en: messageEn,
        type: notificationType,
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'تم الإرسال بنجاح',
        description: `تم إرسال الإشعار بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      navigate('/admin/notifications');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إرسال الإشعار',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleAr || !messageAr) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال العنوان والرسالة بالعربية على الأقل',
        variant: 'destructive',
      });
      return;
    }

    sendNotificationMutation.mutate();
  };

  const getRecipientCount = () => {
    if (recipientType === 'all') return users?.length || 0;
    if (recipientType === 'role' && selectedRole) {
      return users?.filter(u => u.role === selectedRole).length || 0;
    }
    if (recipientType === 'user') return selectedUsers.length;
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إرسال إشعار جديد</h1>
          <p className="text-muted-foreground mt-1">إرسال إشعار إلى المستخدمين</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/notifications')}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Recipient Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">المستلمون</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipientType">نوع المستلم</Label>
                <Select value={recipientType} onValueChange={(value) => setRecipientType(value as RecipientType)}>
                  <SelectTrigger id="recipientType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين</SelectItem>
                    <SelectItem value="role">حسب الدور</SelectItem>
                    <SelectItem value="user">مستخدمون محددون</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'role' && (
                <div>
                  <Label htmlFor="role">الدور</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="branch_manager">مدير فرع</SelectItem>
                      <SelectItem value="branch_employee">موظف فرع</SelectItem>
                      <SelectItem value="customer">عميل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {recipientType === 'user' && (
                <div className="space-y-2">
                  <Label>المستخدمون</Label>
                  <Card className="p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-3">
                      {users?.map((user) => (
                        <div key={user.user_id} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={user.user_id}
                            checked={selectedUsers.includes(user.user_id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user.user_id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.user_id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={user.user_id}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {user.full_name || 'مستخدم'} ({user.role})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  عدد المستلمين: <span className="font-semibold text-foreground">{getRecipientCount()}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Content */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">محتوى الإشعار</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notificationType">نوع الإشعار</Label>
                <Select value={notificationType} onValueChange={(value) => setNotificationType(value as NotificationType)}>
                  <SelectTrigger id="notificationType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">معلومات</SelectItem>
                    <SelectItem value="system">نظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titleAr">العنوان (عربي) *</Label>
                  <Input
                    id="titleAr"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="أدخل العنوان بالعربية"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="titleEn">العنوان (إنجليزي)</Label>
                  <Input
                    id="titleEn"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Enter title in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="messageAr">الرسالة (عربي) *</Label>
                  <Textarea
                    id="messageAr"
                    value={messageAr}
                    onChange={(e) => setMessageAr(e.target.value)}
                    placeholder="أدخل الرسالة بالعربية"
                    rows={5}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="messageEn">الرسالة (إنجليزي)</Label>
                  <Textarea
                    id="messageEn"
                    value={messageEn}
                    onChange={(e) => setMessageEn(e.target.value)}
                    placeholder="Enter message in English"
                    rows={5}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline">
                  <Eye className="h-4 w-4 ml-2" />
                  معاينة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>معاينة الإشعار</DialogTitle>
                  <DialogDescription>
                    كيف سيظهر الإشعار للمستلمين
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Card className="p-4">
                    <div className="flex gap-3">
                      <span className="text-2xl">📢</span>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{titleAr || 'العنوان'}</p>
                        <p className="text-sm text-muted-foreground">
                          {messageAr || 'الرسالة'}
                        </p>
                        <p className="text-xs text-muted-foreground">الآن</p>
                      </div>
                    </div>
                  </Card>
                  {titleEn && (
                    <Card className="p-4">
                      <div className="flex gap-3">
                        <span className="text-2xl">📢</span>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">{titleEn}</p>
                          <p className="text-sm text-muted-foreground">
                            {messageEn}
                          </p>
                          <p className="text-xs text-muted-foreground">Now</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              type="submit"
              disabled={sendNotificationMutation.isPending || getRecipientCount() === 0}
            >
              <Send className="h-4 w-4 ml-2" />
              {sendNotificationMutation.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
