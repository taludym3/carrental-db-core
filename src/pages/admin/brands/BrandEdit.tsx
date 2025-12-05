import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ImageUploader } from '@/components/admin/ImageUploader';

const formSchema = z.object({
  name_en: z.string().min(1, 'الاسم بالإنجليزية مطلوب'),
  name_ar: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const BrandEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (brand) {
      form.reset({
        name_en: brand.name_en,
        name_ar: brand.name_ar || '',
        is_active: brand.is_active,
      });
      setUploadedLogoUrl(brand.logo_url);
    }
  }, [brand, form]);

  const handleImageDeleted = async () => {
    setUploadedLogoUrl(null);
    await supabase
      .from('car_brands')
      .update({ logo_url: null })
      .eq('id', id);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from('car_brands')
        .update({
          name_en: values.name_en,
          name_ar: values.name_ar || null,
          logo_url: uploadedLogoUrl,
          is_active: values.is_active,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث العلامة التجارية بنجاح');
      navigate('/admin/brands');
    } catch (error: any) {
      toast.error(error.message || 'خطأ في التحديث');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/brands')}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">تعديل علامة تجارية</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العلامة التجارية</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية *</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
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
                      <Input placeholder="تويوتا" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>شعار العلامة التجارية</FormLabel>
                <ImageUploader
                  currentImageUrl={brand?.logo_url}
                  bucket="brand-logos"
                  folder="logos"
                  onImageUploaded={setUploadedLogoUrl}
                  onImageDeleted={handleImageDeleted}
                  maxSizeMB={2}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>حالة التفعيل</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        تفعيل أو إلغاء تفعيل العلامة التجارية
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

              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/brands')}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandEdit;
