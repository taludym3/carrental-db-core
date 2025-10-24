import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { toast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { SpecificationsInput } from '@/components/admin/SpecificationsInput';

interface Specifications {
  power?: string;
  engine?: string;
  drivetrain?: string;
  fuel_economy?: string;
  transmission?: string;
}

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

const ModelEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // Fetch model data
  const { data: model, isLoading: modelLoading } = useQuery({
    queryKey: ['car-model', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Update form when model data is loaded
  useEffect(() => {
    if (model) {
      const specs = (model.specifications as Specifications) || {};
      form.reset({
        name_en: model.name_en,
        name_ar: model.name_ar || '',
        brand_id: model.brand_id,
        year: model.year,
        description_en: model.description_en || '',
        description_ar: model.description_ar || '',
        is_active: model.is_active,
        spec_power: specs.power || '',
        spec_engine: specs.engine || '',
        spec_drivetrain: specs.drivetrain || '',
        spec_fuel_economy: specs.fuel_economy || '',
        spec_transmission: specs.transmission || '',
      });
      setImageUrl(model.default_image_url || '');
    }
  }, [model, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Build specifications object from individual fields
      const specifications: Record<string, string> = {};
      if (values.spec_power) specifications.power = values.spec_power;
      if (values.spec_engine) specifications.engine = values.spec_engine;
      if (values.spec_drivetrain) specifications.drivetrain = values.spec_drivetrain;
      if (values.spec_fuel_economy) specifications.fuel_economy = values.spec_fuel_economy;
      if (values.spec_transmission) specifications.transmission = values.spec_transmission;

      const { error } = await supabase
        .from('car_models')
        .update({
          name_en: values.name_en,
          name_ar: values.name_ar || null,
          brand_id: values.brand_id,
          year: values.year,
          description_en: values.description_en || null,
          description_ar: values.description_ar || null,
          default_image_url: imageUrl || null,
          specifications: Object.keys(specifications).length > 0 ? specifications : null,
          is_active: values.is_active,
        })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-models'] });
      queryClient.invalidateQueries({ queryKey: ['car-model', id] });
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث الموديل بنجاح',
      });
      navigate(`/admin/models/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'فشل التحديث',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  if (modelLoading) {
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/models/${id}`)}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل الموديل</h1>
          <p className="text-muted-foreground">تحديث معلومات الموديل</p>
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
          <SpecificationsInput form={form} initialValue={model?.specifications as Specifications} />

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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'جاري التحديث...' : 'حفظ التغييرات'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/models/${id}`)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ModelEdit;
