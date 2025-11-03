import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Palette } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ColorCard } from './components/ColorCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ColorsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: colors, isLoading, refetch } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_colors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // جلب عدد السيارات المرتبطة باللون المراد حذفه
  const { data: relatedCars } = useQuery({
    queryKey: ['color-cars', deleteId],
    queryFn: async () => {
      if (!deleteId) return [];
      
      const { data, error } = await supabase
        .from('cars')
        .select('id')
        .eq('color_id', deleteId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!deleteId,
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // حذف اللون (السيارات المرتبطة سيتم تعيين color_id لها إلى NULL تلقائياً)
      const { error } = await supabase
        .from('car_colors')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'تم الحذف بنجاح',
        description: relatedCars && relatedCars.length > 0
          ? `تم حذف اللون بنجاح. تم إزالة اللون من ${relatedCars.length} سيارة`
          : 'تم حذف اللون بنجاح',
      });

      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);
      
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء الحذف',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الألوان</h1>
          <p className="text-muted-foreground mt-1">
            إدارة ألوان السيارات في النظام
          </p>
        </div>
        <Button onClick={() => navigate('/admin/colors/add')}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة لون جديد
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))
          ) : colors && colors.length > 0 ? (
            colors.map((color) => (
              <ColorCard
                key={color.id}
                color={color}
                onView={() => navigate(`/admin/colors/${color.id}`)}
                onEdit={() => navigate(`/admin/colors/${color.id}/edit`)}
                onDelete={() => setDeleteId(color.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Palette className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد ألوان</h3>
              <p className="text-muted-foreground">لم يتم إضافة أي ألوان حتى الآن</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اللون</TableHead>
                <TableHead>الاسم بالإنجليزية</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>الكود السداسي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : colors && colors.length > 0 ? (
                colors.map((color) => (
                  <TableRow key={color.id}>
                    <TableCell>
                      <div
                        className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
                        style={{ backgroundColor: color.hex_code || '#cccccc' }}
                        title={color.hex_code || 'لا يوجد كود لوني'}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{color.name_en}</TableCell>
                    <TableCell>{color.name_ar || '-'}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {color.hex_code || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={color.is_active ? 'default' : 'secondary'}>
                        {color.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(color.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/colors/${color.id}`)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/colors/${color.id}/edit`)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(color.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد ألوان مضافة حتى الآن
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا اللون؟
              {relatedCars && relatedCars.length > 0 && (
                <span className="block mt-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                  <span className="font-bold text-amber-700 dark:text-amber-400">⚠️ تنبيه:</span>
                  <span className="block mt-1 text-amber-800 dark:text-amber-300">
                    يوجد <strong>{relatedCars.length}</strong> سيارة مرتبطة بهذا اللون.
                  </span>
                  <span className="block mt-2 text-sm text-amber-700 dark:text-amber-400">
                    سيتم إزالة اللون من هذه السيارات تلقائياً (ستصبح بدون لون محدد).
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
            <AlertDialogAction
              onClick={handleDelete}
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

export default ColorsList;
