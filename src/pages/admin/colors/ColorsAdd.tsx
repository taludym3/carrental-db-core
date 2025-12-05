import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ColorFormData {
  name_en: string;
  name_ar: string;
  hex_code: string;
  is_active: boolean;
}

const ColorsAdd = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<ColorFormData>({
    defaultValues: {
      is_active: true,
      hex_code: '#000000',
    },
  });

  const hexCode = watch('hex_code');

  const onSubmit = async (data: ColorFormData) => {
    try {
      const { error } = await supabase.from('car_colors').insert([data]);

      if (error) throw error;

      toast.success('تم إضافة اللون الجديد بنجاح');
      navigate('/admin/colors');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إضافة اللون');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/colors')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">إضافة لون جديد</h1>
          <p className="text-muted-foreground mt-1">
            أضف لون جديد إلى النظام
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>معلومات اللون</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name_en">
                الاسم بالإنجليزية <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name_en"
                {...register('name_en', {
                  required: 'الاسم بالإنجليزية مطلوب',
                })}
                placeholder="مثال: Black"
              />
              {errors.name_en && (
                <p className="text-sm text-destructive">{errors.name_en.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_ar">الاسم بالعربية</Label>
              <Input
                id="name_ar"
                {...register('name_ar')}
                placeholder="مثال: أسود"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hex_code">
                الكود السداسي للون <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <Input
                    id="hex_code"
                    {...register('hex_code', {
                      required: 'الكود السداسي مطلوب',
                      pattern: {
                        value: /^#[0-9A-Fa-f]{6}$/,
                        message: 'الكود السداسي غير صحيح (مثال: #000000)',
                      },
                    })}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexCode || '#000000'}
                    onChange={(e) => setValue('hex_code', e.target.value)}
                    className="w-14 h-10 rounded border border-border cursor-pointer"
                    title="اختر اللون"
                  />
                  <div
                    className="w-14 h-10 rounded border-2 border-border shadow-sm"
                    style={{ backgroundColor: hexCode || '#000000' }}
                    title="معاينة اللون"
                  />
                </div>
              </div>
              {errors.hex_code && (
                <p className="text-sm text-destructive">{errors.hex_code.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                يمكنك استخدام منتقي الألوان أو كتابة الكود السداسي مباشرة
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">حالة اللون</Label>
                <p className="text-sm text-muted-foreground">
                  هل تريد تفعيل هذا اللون؟
                </p>
              </div>
              <Switch
                id="is_active"
                {...register('is_active')}
                defaultChecked
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة اللون'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/colors')}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ColorsAdd;
