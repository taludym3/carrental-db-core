import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { BranchCard } from './components/BranchCard';
import { BranchesTableSkeleton } from './components/BranchesTableSkeleton';
import { BranchesCardsSkeleton } from './components/BranchesCardsSkeleton';
import { BranchesEmptyState } from './components/BranchesEmptyState';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name_ar: string | null;
  name_en: string;
  location_ar: string | null;
  location_en: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  manager_id: string | null;
  manager?: any;
}

export default function BranchesList() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['admin-branches', debouncedSearch, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        query = query.or(`name_ar.ilike.%${debouncedSearch}%,name_en.ilike.%${debouncedSearch}%,location_ar.ilike.%${debouncedSearch}%,location_en.ilike.%${debouncedSearch}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف الفرع بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حذف الفرع');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">إدارة الفروع</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            عرض وإدارة جميع فروع النظام
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/branches/add">
            <Plus className="ml-2 h-4 w-4" />
            إضافة فرع
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو الموقع..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        isMobile ? (
          <BranchesCardsSkeleton />
        ) : (
          <BranchesTableSkeleton />
        )
      ) : branches?.length === 0 ? (
        <Card>
          <BranchesEmptyState hasSearch={!!debouncedSearch} />
        </Card>
      ) : isMobile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches?.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onView={(id) => navigate(`/admin/branches/${id}`)}
              onEdit={(id) => navigate(`/admin/branches/${id}/edit`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الموقع</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المدير</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches?.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    {branch.name_ar || branch.name_en}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{branch.location_ar || branch.location_en}</span>
                    </div>
                  </TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                      {branch.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(branch.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/branches/${branch.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/branches/${branch.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(branch.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
