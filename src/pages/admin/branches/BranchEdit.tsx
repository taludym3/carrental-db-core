import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Save } from 'lucide-react';
import { ManagerSelect } from './components/ManagerSelect';
import { BranchLocationMap } from './components/BranchLocationMap';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { WorkingHoursSelector } from '@/components/admin/WorkingHoursSelector';
import { SaudiCitiesSelector } from '@/components/admin/SaudiCitiesSelector';
import { toast } from 'sonner';
import { useEffect } from 'react';

const formSchema = z.object({
  name_en: z.string().min(2, 'الاسم بالإنجليزية مطلوب'),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  phone: z.string().min(10, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  location_en: z.string().min(5, 'العنوان بالإنجليزية مطلوب'),
  location_ar: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  working_hours: z.string().optional(),
  manager_id: z.string().uuid().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BranchEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      phone: '',
      email: '',
      location_en: '',
      location_ar: '',
      working_hours: '',
      is_active: true,
      images: [],
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name_en: branch.name_en,
        name_ar: branch.name_ar || '',
        description_en: branch.description_en || '',
        description_ar: branch.description_ar || '',
        phone: branch.phone,
        email: branch.email || '',
        location_en: branch.location_en,
        location_ar: branch.location_ar || '',
        latitude: branch.latitude || undefined,
        longitude: branch.longitude || undefined,
        working_hours: branch.working_hours || '',
        manager_id: branch.manager_id || '',
        is_active: branch.is_active,
        images: branch.images || [],
      });
    }
  }, [branch, form]);

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name_en: values.name_en,
          name_ar: values.name_ar || null,
          description_en: values.description_en || null,
          description_ar: values.description_ar || null,
          phone: values.phone,
          email: values.email || null,
          location_en: values.location_en,
          location_ar: values.location_ar || null,
          latitude: values.latitude || null,
          longitude: values.longitude || null,
          working_hours: values.working_hours || null,
          manager_id: values.manager_id || null,
          is_active: values.is_active,
          images: values.images || null,
        })
        .eq('id', id!);

      if (error) throw error;

      toast.success('تم تحديث الفرع بنجاح');
      navigate(`/admin/branches/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الفرع');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">الفرع غير موجود</h2>
        <Button asChild>
          <Link to="/admin/branches">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/admin/branches/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">تعديل الفرع</h1>
          <p className="text-muted-foreground mt-1">
            {branch.name_ar || branch.name_en}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالإنجليزية *</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم بالعربية</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم الفرع" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف بالإنجليزية</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Branch Description"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف بالعربية</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف الفرع"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">معلومات الاتصال</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="05xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <FormField
                control={form.control}
                name="working_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ساعات العمل</FormLabel>
                    <FormControl>
                      <WorkingHoursSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">الموقع</h3>

              <div>
                <SaudiCitiesSelector
                  locationAr={form.watch('location_ar') || ''}
                  locationEn={form.watch('location_en') || ''}
                  onLocationArChange={(value) => form.setValue('location_ar', value)}
                  onLocationEnChange={(value) => form.setValue('location_en', value)}
                />
              </div>

              <div>
                <FormLabel>اختر الموقع على الخريطة</FormLabel>
                <div className="mt-2">
                  <BranchLocationMap
                    latitude={form.watch('latitude')}
                    longitude={form.watch('longitude')}
                    onLocationChange={(lat, lng) => {
                      form.setValue('latitude', lat);
                      form.setValue('longitude', lng);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager & Settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">الإعدادات</h3>

              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدير الفرع</FormLabel>
                    <FormControl>
                      <ManagerSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        currentManagerId={branch.manager_id || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">حالة الفرع</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'الفرع نشط' : 'الفرع غير نشط'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">صور الفرع</h3>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiImageUploader
                        currentImages={field.value || []}
                        onImagesChange={field.onChange}
                        bucket="branch-images"
                        folder="branch-images"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-1 sm:flex-none"
            >
              <Save className="ml-2 h-4 w-4" />
              حفظ التغييرات
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/branches/${id}`)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
