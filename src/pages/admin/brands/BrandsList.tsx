import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Eye, Pencil, Trash2, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { BrandCard } from './components/BrandCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Brand {
  id: string;
  name_en: string;
  name_ar: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

const BrandsList = () => {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: brands, isLoading, refetch } = useQuery({
    queryKey: ['admin-brands', search],
    queryFn: async () => {
      let query = supabase
        .from('car_brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Brand[];
    },
  });

  const { data: relatedModels } = useQuery({
    queryKey: ['brand-models', deleteId],
    queryFn: async () => {
      if (!deleteId) return [];
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name_en, name_ar')
        .eq('brand_id', deleteId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!deleteId,
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      if (relatedModels && relatedModels.length > 0) {
        const modelIds = relatedModels.map(m => m.id);
        
        const { error: modelsError } = await supabase
          .from('car_models')
          .delete()
          .in('id', modelIds);
        
        if (modelsError) throw modelsError;
      }
      
      const { error: brandError } = await supabase
        .from('car_brands')
        .delete()
        .eq('id', deleteId);

      if (brandError) throw brandError;

      toast.success(
        relatedModels && relatedModels.length > 0
          ? `تم حذف العلامة التجارية و ${relatedModels.length} موديل مرتبط بنجاح`
          : 'تم حذف العلامة التجارية بنجاح'
      );

      refetch();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">العلامات التجارية</h1>
        <Button asChild>
          <Link to="/admin/brands/add">
            <Plus className="ml-2 h-4 w-4" />
            إضافة علامة تجارية
          </Link>
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))
          ) : brands && brands.length > 0 ? (
            brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onView={() => navigate(`/admin/brands/${brand.id}`)}
                onEdit={() => navigate(`/admin/brands/${brand.id}/edit`)}
                onDelete={() => setDeleteId(brand.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Tag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد علامات تجارية</h3>
              <p className="text-muted-foreground">لم يتم إضافة أي علامات تجارية حتى الآن</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>قائمة العلامات التجارية</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !brands || brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد علامات تجارية
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشعار</TableHead>
                    <TableHead>الاسم بالإنجليزية</TableHead>
                    <TableHead>الاسم بالعربية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        {brand.logo_url ? (
                          <img 
                            src={brand.logo_url} 
                            alt={brand.name_en}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs">
                            لا يوجد
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{brand.name_en}</TableCell>
                      <TableCell>{brand.name_ar || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                          {brand.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(brand.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/brands/${brand.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/brands/${brand.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(brand.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه العلامة التجارية؟
              {relatedModels && relatedModels.length > 0 && (
                <span className="block mt-2 bg-destructive/10 p-3 rounded-md">
                  <span className="font-bold text-destructive">⚠️ تحذير مهم:</span>
                  <span className="block mt-1">
                    سيتم حذف <strong>{relatedModels.length}</strong> موديل مرتبط بهذه العلامة:
                  </span>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    {relatedModels.slice(0, 5).map(model => (
                      <li key={model.id}>{model.name_ar || model.name_en}</li>
                    ))}
                    {relatedModels.length > 5 && (
                      <li className="text-muted-foreground">
                        ... و {relatedModels.length - 5} موديل آخر
                      </li>
                    )}
                  </ul>
                  <span className="block mt-2 text-sm text-muted-foreground">
                    سيتم أيضاً حذف جميع السيارات المرتبطة بهذه الموديلات تلقائياً.
                  </span>
                </span>
              )}
              <span className="block mt-2 text-muted-foreground text-sm">
                لا يمكن التراجع عن هذا الإجراء.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrandsList;
