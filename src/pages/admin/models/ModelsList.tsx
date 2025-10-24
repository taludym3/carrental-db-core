import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
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

const ModelsList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);

  // Fetch brands for filter
  const { data: brands } = useQuery({
    queryKey: ['car-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name_en');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch models with brand info
  const { data: models, isLoading } = useQuery({
    queryKey: ['car-models', searchTerm, brandFilter],
    queryFn: async () => {
      let query = supabase
        .from('car_models')
        .select(`
          *,
          car_brands (
            id,
            name_en,
            name_ar,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`);
      }

      if (brandFilter && brandFilter !== 'all') {
        query = query.eq('brand_id', brandFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('car_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-models'] });
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف الموديل بنجاح',
      });
      setDeleteModelId(null);
    },
    onError: (error: any) => {
      let errorMessage = 'حدث خطأ أثناء الحذف';
      
      // Check for foreign key constraint errors
      if (error.message?.includes('foreign key constraint') || 
          error.code === '23503') {
        errorMessage = 'لا يمكن حذف هذا الموديل لأنه مرتبط بسيارات موجودة في النظام';
      }
      
      toast({
        title: 'فشل الحذف',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموديلات</h1>
          <p className="text-muted-foreground">إدارة موديلات السيارات وصورها</p>
        </div>
        <Button onClick={() => navigate('/admin/models/add')}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة موديل
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن موديل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="فلترة حسب العلامة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع العلامات</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name_ar || brand.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>الاسم (عربي)</TableHead>
              <TableHead>الاسم (إنجليزي)</TableHead>
              <TableHead>العلامة التجارية</TableHead>
              <TableHead>السنة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : models?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  لا توجد موديلات
                </TableCell>
              </TableRow>
            ) : (
              models?.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    {model.default_image_url ? (
                      <img
                        src={model.default_image_url}
                        alt={model.name_en}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">لا صورة</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{model.name_ar || '-'}</TableCell>
                  <TableCell>{model.name_en}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {model.car_brands?.logo_url && (
                        <img
                          src={model.car_brands.logo_url}
                          alt={model.car_brands.name_en}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <span>{model.car_brands?.name_ar || model.car_brands?.name_en}</span>
                    </div>
                  </TableCell>
                  <TableCell>{model.year}</TableCell>
                  <TableCell>
                    <Badge variant={model.is_active ? 'default' : 'secondary'}>
                      {model.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/models/${model.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/models/${model.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModelId(model.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteModelId} onOpenChange={() => setDeleteModelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الموديل؟
              <span className="block mt-2 text-destructive font-medium">
                ⚠️ تحذير: سيتم حذف جميع السيارات المرتبطة بهذا الموديل تلقائياً.
              </span>
              <span className="block mt-1 text-muted-foreground text-sm">
                لن يمكن التراجع عن هذا الإجراء.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModelId && deleteMutation.mutate(deleteModelId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModelsList;
