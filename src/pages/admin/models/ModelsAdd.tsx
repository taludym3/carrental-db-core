import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { SpecificationsInput } from '@/components/admin/SpecificationsInput';

const formSchema = z.object({
  name_en: z.string().min(1, 'الاسم بالإنجليزية مطلوب').max(100),
  name_ar: z.string().max(100).optional(),
  brand_id: z.string().min(1, 'العلامة التجارية مطلوبة'),
  year: z.number().min(1900, 'السنة يجب أن تكون بعد 1900').max(new Date().getFullYear() + 1, 'السنة غير صحيحة'),
  description_en: z.string().max(500).optional(),
  description_ar: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  // Specification fields
  spec_power: z.string().optional(),
  spec_engine: z.string().optional(),
  spec_drivetrain: z.string().optional(),
  spec_fuel_economy: z.string().optional(),
  spec_transmission: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ModelsAdd = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: '',
      name_ar: '',
      brand_id: '',
      year: new Date().getFullYear(),
      description_en: '',
      description_ar: '',
      is_active: true,
      spec_power: '',
      spec_engine: '',
      spec_drivetrain: '',
      spec_fuel_economy: '',
      spec_transmission: '',
    },
  });

  // Fetch brands
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ['car-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .eq('is_active', true)
        .order('name_en');
      
      if (error) throw error;
      return data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Build specifications object from individual fields
      const specifications: Record<string, string> = {};
      if (values.spec_power) specifications.power = values.spec_power;
      if (values.spec_engine) specifications.engine = values.spec_engine;
      if (values.spec_drivetrain) specifications.drivetrain = values.spec_drivetrain;
      if (values.spec_fuel_economy) specifications.fuel_economy = values.spec_fuel_economy;
      if (values.spec_transmission) specifications.transmission = values.spec_transmission;

      const { error } = await supabase.from('car_models').insert({
        name_en: values.name_en,
        name_ar: values.name_ar || null,
        brand_id: values.brand_id,
        year: values.year,
        description_en: values.description_en || null,
        description_ar: values.description_ar || null,
        default_image_url: imageUrl || null,
        specifications: Object.keys(specifications).length > 0 ? specifications : null,
        is_active: values.is_active,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الموديل بنجاح');
      navigate('/admin/models');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل الإضافة');
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/models')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">إضافة موديل جديد</h1>
          <p className="text-muted-foreground">أضف موديل سيارة جديد إلى النظام</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name (English) */}
            <FormField
              control={form.control}
              name="name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم (إنجليزي) *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: Camry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name (Arabic) */}
            <FormField
              control={form.control}
              name="name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم (عربي)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كامري" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Brand */}
            <FormField
              control={form.control}
              name="brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العلامة التجارية *</FormLabel>
                  <Select
                    disabled={brandsLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العلامة التجارية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          <div className="flex items-center gap-2">
                            {brand.logo_url && (
                              <img
                                src={brand.logo_url}
                                alt={brand.name_en}
                                className="h-5 w-5 object-contain"
                              />
                            )}
                            <span>{brand.name_ar || brand.name_en}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السنة *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (English) */}
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (إنجليزي)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف الموديل بالإنجليزية"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description (Arabic) */}
            <FormField
              control={form.control}
              name="description_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (عربي)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف الموديل بالعربية"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Specifications */}
          <SpecificationsInput form={form} />

          {/* Image Upload */}
          <div className="space-y-2">
            <FormLabel>الصورة الافتراضية</FormLabel>
            <ImageUploader
              currentImageUrl={imageUrl}
              onImageUploaded={setImageUrl}
              onImageDeleted={() => setImageUrl('')}
              bucket="car-model-images"
              folder="models"
              maxSizeMB={5}
            />
          </div>

          {/* Active Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>الحالة</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    تفعيل أو تعطيل الموديل
                  </div>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة الموديل'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/models')}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ModelsAdd;
