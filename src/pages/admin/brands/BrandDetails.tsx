import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BrandDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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

  const { data: modelsCount } = useQuery({
    queryKey: ['brand-models-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('car_models')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', id);

      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (!brand) {
    return <div className="text-center py-8">العلامة التجارية غير موجودة</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/brands')}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">تفاصيل العلامة التجارية</h1>
        </div>
        <Button onClick={() => navigate(`/admin/brands/${id}/edit`)}>
          <Pencil className="ml-2 h-4 w-4" />
          تعديل
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {brand.logo_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">الشعار</p>
                <img 
                  src={brand.logo_url} 
                  alt={brand.name_en}
                  className="h-20 w-20 object-contain"
                />
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">الاسم بالإنجليزية</p>
              <p className="text-lg font-semibold">{brand.name_en}</p>
            </div>

            {brand.name_ar && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">الاسم بالعربية</p>
                <p className="text-lg font-semibold">{brand.name_ar}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">الحالة</p>
              <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                {brand.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</p>
              <p className="text-lg">
                {new Date(brand.created_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">عدد الموديلات</p>
                <p className="text-3xl font-bold">{modelsCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandDetails;
