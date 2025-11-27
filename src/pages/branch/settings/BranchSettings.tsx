import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { BranchLocationMap } from '@/pages/admin/branches/components/BranchLocationMap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

const branchSettingsSchema = z.object({
  name_en: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  name_ar: z.string().min(1, 'الاسم بالعربية مطلوب'),
  location_en: z.string().min(1, 'الموقع بالإنجليزية مطلوب'),
  location_ar: z.string().min(1, 'الموقع بالعربية مطلوب'),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  working_hours: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

type BranchSettingsFormData = z.infer<typeof branchSettingsSchema>;

export default function BranchSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [latitude, setLatitude] = useState<number>(24.7136);
  const [longitude, setLongitude] = useState<number>(46.6753);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BranchSettingsFormData>({
    resolver: zodResolver(branchSettingsSchema),
  });

  useEffect(() => {
    loadBranchData();
  }, [user]);

  const loadBranchData = async () => {
    if (!user) return;

    try {
      // التحقق من أن المستخدم مدير فرع
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'branch') {
        toast.error('غير مصرح لك بالوصول إلى هذه الصفحة');
        navigate('/branch');
        return;
      }

      setIsManager(true);

      // جلب branch_id من الملف الشخصي
      const { data: profileData } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('user_id', user.id)
        .single();

      if (!profileData?.branch_id) {
        toast.error('لم يتم العثور على الفرع');
        navigate('/branch');
        return;
      }

      setBranchId(profileData.branch_id);

      // جلب بيانات الفرع
      const { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', profileData.branch_id)
        .single();

      if (error) throw error;

      if (branchData) {
        setLatitude(branchData.latitude || 24.7136);
        setLongitude(branchData.longitude || 46.6753);
        
        reset({
          name_en: branchData.name_en,
          name_ar: branchData.name_ar || '',
          location_en: branchData.location_en,
          location_ar: branchData.location_ar || '',
          description_en: branchData.description_en || '',
          description_ar: branchData.description_ar || '',
          email: branchData.email || '',
          phone: branchData.phone || '',
          working_hours: branchData.working_hours || '',
          latitude: branchData.latitude,
          longitude: branchData.longitude,
        });

        setImages(branchData.images || []);
      }
    } catch (error: any) {
      console.error('Error loading branch data:', error);
      toast.error('حدث خطأ في تحميل بيانات الفرع');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit = async (data: BranchSettingsFormData) => {
    if (!branchId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name_en: data.name_en,
          name_ar: data.name_ar,
          location_en: data.location_en,
          location_ar: data.location_ar,
          description_en: data.description_en || null,
          description_ar: data.description_ar || null,
          email: data.email || null,
          phone: data.phone,
          working_hours: data.working_hours || null,
          latitude: data.latitude,
          longitude: data.longitude,
          images,
          updated_at: new Date().toISOString(),
        })
        .eq('id', branchId);

      if (error) throw error;

      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error: any) {
      console.error('Error saving branch settings:', error);
      toast.error('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="إعدادات الفرع"
          description="تعديل معلومات الفرع"
        />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="إعدادات الفرع"
          description="تعديل معلومات الفرع"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            هذه الصفحة متاحة فقط لمدراء الفروع
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إعدادات الفرع"
        description="تعديل معلومات الفرع"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* المعلومات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name_ar">اسم الفرع (عربي) *</Label>
                <Input
                  id="name_ar"
                  {...register('name_ar')}
                  placeholder="الفرع الرئيسي"
                />
                {errors.name_ar && (
                  <p className="text-sm text-destructive">{errors.name_ar.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_en">اسم الفرع (إنجليزي) *</Label>
                <Input
                  id="name_en"
                  {...register('name_en')}
                  placeholder="Main Branch"
                />
                {errors.name_en && (
                  <p className="text-sm text-destructive">{errors.name_en.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="branch@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+966 50 123 4567"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_hours">ساعات العمل</Label>
              <Input
                id="working_hours"
                {...register('working_hours')}
                placeholder="السبت - الخميس: 8 صباحاً - 10 مساءً"
              />
            </div>
          </CardContent>
        </Card>

        {/* الموقع */}
        <Card>
          <CardHeader>
            <CardTitle>الموقع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_ar">الموقع (عربي) *</Label>
                <Input
                  id="location_ar"
                  {...register('location_ar')}
                  placeholder="الرياض، شارع الملك فهد"
                />
                {errors.location_ar && (
                  <p className="text-sm text-destructive">{errors.location_ar.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_en">الموقع (إنجليزي) *</Label>
                <Input
                  id="location_en"
                  {...register('location_en')}
                  placeholder="Riyadh, King Fahd Road"
                />
                {errors.location_en && (
                  <p className="text-sm text-destructive">{errors.location_en.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>الموقع على الخريطة</Label>
              <BranchLocationMap
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
                readonly={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* الوصف */}
        <Card>
          <CardHeader>
            <CardTitle>الوصف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description_ar">الوصف (عربي)</Label>
              <Textarea
                id="description_ar"
                {...register('description_ar')}
                rows={4}
                placeholder="اكتب وصفاً للفرع بالعربية..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_en">الوصف (إنجليزي)</Label>
              <Textarea
                id="description_en"
                {...register('description_en')}
                rows={4}
                placeholder="Write branch description in English..."
              />
            </div>
          </CardContent>
        </Card>

        {/* الصور */}
        <Card>
          <CardHeader>
            <CardTitle>صور الفرع</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiImageUploader
              currentImages={images}
              onImagesChange={setImages}
              bucket="branch-images"
              folder="branch-images"
              maxImages={10}
            />
          </CardContent>
        </Card>

        {/* أزرار الحفظ */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/branch')}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="ml-2 h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </div>
  );
}
