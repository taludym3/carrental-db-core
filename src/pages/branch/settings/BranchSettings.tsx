import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchLocationMap } from '@/pages/admin/branches/components/BranchLocationMap';
import { WorkingHoursSelector } from '@/components/admin/WorkingHoursSelector';
import { SaudiCitiesSelector } from '@/components/admin/SaudiCitiesSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertCircle,
  Save,
  Building2,
  Clock,
  MapPin,
  FileText,
  Circle,
} from 'lucide-react';

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [initialValues, setInitialValues] = useState<BranchSettingsFormData | null>(null);

  const form = useForm<BranchSettingsFormData>({
    resolver: zodResolver(branchSettingsSchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      location_en: '',
      location_ar: '',
      description_en: '',
      description_ar: '',
      email: '',
      phone: '',
      working_hours: '',
      latitude: null,
      longitude: null,
    },
  });

  const currentValues = form.watch();

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialValues) return false;
    return JSON.stringify(currentValues) !== JSON.stringify(initialValues);
  }, [currentValues, initialValues]);

  useEffect(() => {
    loadBranchData();
  }, [user]);

  const loadBranchData = async () => {
    if (!user) return;

    try {
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

      const { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', profileData.branch_id)
        .single();

      if (error) throw error;

      if (branchData) {
        setLatitude(branchData.latitude || 24.7136);
        setLongitude(branchData.longitude || 46.6753);

        const formValues: BranchSettingsFormData = {
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
        };

        form.reset(formValues);
        setInitialValues(formValues);
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
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
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

      setInitialValues(data);
      toast.success('تم حفظ التغييرات بنجاح');
    } catch (error: any) {
      console.error('Error saving branch settings:', error);
      toast.error('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      navigate('/branch');
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    navigate('/branch');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="إعدادات الفرع" description="تعديل معلومات الفرع" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="space-y-6">
        <PageHeader title="إعدادات الفرع" description="تعديل معلومات الفرع" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>هذه الصفحة متاحة فقط لمدراء الفروع</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <PageHeader title="إعدادات الفرع" description="تعديل معلومات الفرع" />
        
        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-full text-sm">
            <Circle className="h-2 w-2 fill-current animate-pulse" />
            <span>تغييرات غير محفوظة</span>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">الأساسية</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">ساعات العمل</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">الموقع</span>
              </TabsTrigger>
              <TabsTrigger value="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">الوصف</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                  <CardDescription>
                    معلومات الاتصال والبيانات الرئيسية للفرع
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name_ar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الفرع (عربي) *</FormLabel>
                          <FormControl>
                            <Input placeholder="الفرع الرئيسي" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name_en"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الفرع (إنجليزي) *</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Branch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="branch@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف *</FormLabel>
                          <FormControl>
                            <Input placeholder="+966 50 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working Hours Tab */}
            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ساعات العمل
                  </CardTitle>
                  <CardDescription>
                    حدد أوقات عمل الفرع لكل يوم من أيام الأسبوع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="working_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <WorkingHoursSelector
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    الموقع
                  </CardTitle>
                  <CardDescription>
                    حدد عنوان وموقع الفرع على الخريطة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SaudiCitiesSelector
                    locationAr={form.watch('location_ar') || ''}
                    locationEn={form.watch('location_en') || ''}
                    onLocationArChange={(value) => form.setValue('location_ar', value)}
                    onLocationEnChange={(value) => form.setValue('location_en', value)}
                  />

                  <div className="space-y-2">
                    <FormLabel>الموقع على الخريطة</FormLabel>
                    <BranchLocationMap
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={handleLocationChange}
                      readonly={false}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    الوصف
                  </CardTitle>
                  <CardDescription>
                    أضف وصفاً تفصيلياً للفرع (اختياري)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف (عربي)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="اكتب وصفاً للفرع بالعربية..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف (إنجليزي)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Write branch description in English..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50">
            <div className="container max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {hasUnsavedChanges ? (
                  <>
                    <Circle className="h-2 w-2 fill-warning text-warning animate-pulse" />
                    <span>لديك تغييرات غير محفوظة</span>
                  </>
                ) : (
                  <span>جميع التغييرات محفوظة</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving || !hasUnsavedChanges}>
                  <Save className="ml-2 h-4 w-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تجاهل التغييرات؟</AlertDialogTitle>
            <AlertDialogDescription>
              لديك تغييرات غير محفوظة. هل أنت متأكد من أنك تريد المغادرة بدون حفظ؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>متابعة التعديل</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              تجاهل التغييرات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}