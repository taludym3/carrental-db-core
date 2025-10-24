import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Pencil, Trash2, Gauge, Settings, Fuel, Zap, Cog } from 'lucide-react';
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

interface Specifications {
  power?: string;
  engine?: string;
  drivetrain?: string;
  fuel_economy?: string;
  transmission?: string;
}

const ModelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch model details with brand and cars count
  const { data: model, isLoading } = useQuery({
    queryKey: ['car-model', id],
    queryFn: async () => {
      const { data: modelData, error: modelError } = await supabase
        .from('car_models')
        .select(`
          *,
          car_brands (
            id,
            name_en,
            name_ar,
            logo_url
          )
        `)
        .eq('id', id!)
        .single();

      if (modelError) throw modelError;

      // Get count of cars using this model
      const { count, error: countError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('model_id', id!);

      if (countError) throw countError;

      return { ...modelData, carsCount: count || 0 };
    },
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('car_models')
        .delete()
        .eq('id', id!);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-models'] });
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف الموديل بنجاح',
      });
      navigate('/admin/models');
    },
    onError: (error) => {
      toast({
        title: 'فشل الحذف',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">الموديل غير موجود</p>
        <Button onClick={() => navigate('/admin/models')}>
          العودة إلى القائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/models')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل الموديل</h1>
            <p className="text-muted-foreground">عرض معلومات الموديل الكاملة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/admin/models/${id}/edit`)}>
            <Pencil className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذا الموديل؟ سيتم حذف الصورة تلقائياً. لن يمكن التراجع عن هذا الإجراء.
                  {model.carsCount > 0 && (
                    <span className="block mt-2 text-destructive font-semibold">
                      تحذير: يوجد {model.carsCount} سيارة مرتبطة بهذا الموديل!
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Card */}
        <Card>
          <CardHeader>
            <CardTitle>الصورة الافتراضية</CardTitle>
          </CardHeader>
          <CardContent>
            {model.default_image_url ? (
              <img
                src={model.default_image_url}
                alt={model.name_en}
                className="w-full rounded-lg object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">لا توجد صورة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم (إنجليزي)</p>
              <p className="font-semibold">{model.name_en}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الاسم (عربي)</p>
              <p className="font-semibold">{model.name_ar || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">العلامة التجارية</p>
              <div className="flex items-center gap-2 mt-1">
                {model.car_brands?.logo_url && (
                  <img
                    src={model.car_brands.logo_url}
                    alt={model.car_brands.name_en}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <p className="font-semibold">
                  {model.car_brands?.name_ar || model.car_brands?.name_en}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">السنة</p>
              <p className="font-semibold">{model.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحالة</p>
              <Badge variant={model.is_active ? 'default' : 'secondary'}>
                {model.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عدد السيارات المرتبطة</p>
              <p className="font-semibold">{model.carsCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Descriptions Card */}
        <Card>
          <CardHeader>
            <CardTitle>الأوصاف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">الوصف (إنجليزي)</p>
              <p className="mt-1">{model.description_en || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الوصف (عربي)</p>
              <p className="mt-1">{model.description_ar || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Specifications Card */}
        <Card>
          <CardHeader>
            <CardTitle>المواصفات الفنية</CardTitle>
          </CardHeader>
          <CardContent>
            {model.specifications && Object.keys(model.specifications).length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {(model.specifications as Specifications).power && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">القوة الحصانية</p>
                      <p className="font-semibold">{(model.specifications as Specifications).power}</p>
                    </div>
                  </div>
                )}
                {(model.specifications as Specifications).engine && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Settings className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">المحرك</p>
                      <p className="font-semibold">{(model.specifications as Specifications).engine}</p>
                    </div>
                  </div>
                )}
                {(model.specifications as Specifications).drivetrain && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Gauge className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">نظام الدفع</p>
                      <p className="font-semibold">{(model.specifications as Specifications).drivetrain}</p>
                    </div>
                  </div>
                )}
                {(model.specifications as Specifications).fuel_economy && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Fuel className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">استهلاك الوقود</p>
                      <p className="font-semibold">{(model.specifications as Specifications).fuel_economy}</p>
                    </div>
                  </div>
                )}
                {(model.specifications as Specifications).transmission && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Cog className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ناقل الحركة</p>
                      <p className="font-semibold">{(model.specifications as Specifications).transmission}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">لا توجد مواصفات</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelDetails;
