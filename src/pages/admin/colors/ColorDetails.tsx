import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ColorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: color, isLoading } = useQuery({
    queryKey: ['color', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_colors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: carsCount } = useQuery({
    queryKey: ['color-cars-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('color_id', id);

      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!color) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-destructive">اللون غير موجود</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/colors')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {color.name_ar || color.name_en}
            </h1>
            <p className="text-muted-foreground mt-1">تفاصيل اللون</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/colors/${id}/edit`)}>
          <Edit className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات أساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">الاسم بالإنجليزية:</span>
              <span className="font-medium">{color.name_en}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">الاسم بالعربية:</span>
              <span className="font-medium">{color.name_ar || '-'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">الكود السداسي:</span>
              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {color.hex_code || '-'}
              </code>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">الحالة:</span>
              <Badge variant={color.is_active ? 'default' : 'secondary'}>
                {color.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عينة اللون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-full h-40 rounded-lg border-2 border-border shadow-md"
                style={{ backgroundColor: color.hex_code || '#cccccc' }}
              />
              <div className="text-center">
                <p className="text-lg font-semibold">{color.name_ar || color.name_en}</p>
                <p className="text-sm text-muted-foreground font-mono">{color.hex_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">عدد السيارات:</span>
              <span className="font-medium text-lg">{carsCount || 0}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">تاريخ الإضافة:</span>
              <span className="font-medium">
                {new Date(color.created_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">معرف اللون:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {color.id}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ColorDetails;
