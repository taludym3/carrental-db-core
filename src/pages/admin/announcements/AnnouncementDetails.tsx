import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Edit, Trash2, Star, MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AnnouncementStatusToggle } from './components/AnnouncementStatusToggle';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AnnouncementDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement-details', id],
    queryFn: async () => {
      if (!id) throw new Error('No announcement ID');
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Fetch related data
      const [branchData, creatorData] = await Promise.all([
        data.branch_id 
          ? supabase.from('branches').select('name_ar, location_ar').eq('id', data.branch_id).single()
          : Promise.resolve({ data: null }),
        supabase.from('profiles').select('full_name').eq('user_id', data.created_by).single()
      ]);
      
      return {
        ...data,
        branch: branchData.data,
        creator: creatorData.data
      };
    },
    enabled: !!id
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No announcement ID');
      
      // Delete image if exists
      if (announcement?.image_url) {
        const imagePath = announcement.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('announcement-images')
            .remove([imagePath]);
        }
      }

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف الإعلان بنجاح');
      navigate('/admin/announcements');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل حذف الإعلان');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="الإعلان غير موجود"
          action={
            <Button variant="outline" onClick={() => navigate('/admin/announcements')}>
              <ArrowRight className="h-4 w-4" />
              العودة للقائمة
            </Button>
          }
        />
      </div>
    );
  }

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { label: 'منخفضة', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'عادية', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'عالية', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'عاجلة', className: 'bg-red-100 text-red-800' }
    };
    return configs[priority as keyof typeof configs] || configs.normal;
  };

  const priorityConfig = getPriorityConfig(announcement.priority);
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="تفاصيل الإعلان"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/announcements')}>
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
            <Button onClick={() => navigate(`/admin/announcements/${id}/edit`)}>
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
          </div>
        }
      />

      {announcement.image_url && (
        <Card>
          <CardContent className="p-0">
            <div className="relative h-96 w-full">
              <img
                src={announcement.image_url}
                alt={announcement.title_ar || announcement.title_en}
                className="h-full w-full object-cover rounded-t-lg"
              />
              {announcement.is_featured && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
                    <Star className="h-5 w-5 ml-2 fill-current" />
                    إعلان مميز
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الإعلان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">العنوان (عربي)</label>
              <p className="font-semibold text-lg mt-1">{announcement.title_ar}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">العنوان (إنجليزي)</label>
              <p className="font-medium mt-1">{announcement.title_en}</p>
            </div>

            {announcement.description_ar && (
              <div>
                <label className="text-sm text-muted-foreground">الوصف (عربي)</label>
                <p className="mt-1 whitespace-pre-wrap">{announcement.description_ar}</p>
              </div>
            )}

            {announcement.description_en && (
              <div>
                <label className="text-sm text-muted-foreground">الوصف (إنجليزي)</label>
                <p className="mt-1 whitespace-pre-wrap">{announcement.description_en}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <div>
                <label className="text-sm text-muted-foreground">الأولوية</label>
                <div className="mt-1">
                  <Badge className={priorityConfig.className}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">الحالة</label>
                <div className="mt-1">
                  <AnnouncementStatusToggle
                    announcementId={announcement.id}
                    isActive={announcement.is_active}
                  />
                </div>
              </div>

              {isExpired && (
                <div>
                  <Badge variant="destructive">منتهي الصلاحية</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="text-sm text-muted-foreground">الفرع</label>
                <p className="font-medium">{announcement.branch?.name_ar || 'جميع الفروع'}</p>
              </div>
            </div>

            {announcement.expires_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <label className="text-sm text-muted-foreground">تاريخ الانتهاء</label>
                  <p className="font-medium">
                    {format(new Date(announcement.expires_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="text-sm text-muted-foreground">من أنشأه</label>
                <p className="font-medium">{announcement.creator?.full_name || '-'}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm text-muted-foreground">تاريخ الإنشاء</label>
              <p className="mt-1">
                {format(new Date(announcement.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إجراءات خطيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                حذف الإعلان
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف الإعلان نهائياً ولا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementDetails;
