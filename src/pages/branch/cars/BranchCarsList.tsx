import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Eye, Plus, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const BranchCarsList = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: cars, isLoading } = useQuery({
    queryKey: ['branch-cars', profile?.branch_id, search, statusFilter],
    queryFn: async () => {
      if (!profile?.branch_id) return [];

      let query = supabase
        .from('cars_with_details')
        .select('*')
        .eq('branch_id', profile.branch_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (search) {
        query = query.or(`model_name_ar.ilike.%${search}%,model_name_en.ilike.%${search}%,brand_name_ar.ilike.%${search}%,brand_name_en.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.branch_id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      available: { variant: 'default', label: 'متاحة' },
      rented: { variant: 'secondary', label: 'مؤجرة' },
      maintenance: { variant: 'outline', label: 'صيانة' },
      unavailable: { variant: 'destructive', label: 'غير متاحة' },
    };
    const config = variants[status] || variants.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!profile?.branch_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">لم يتم تعيين فرع لهذا المستخدم</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة السيارات</h1>
          <p className="text-muted-foreground">قائمة سيارات الفرع</p>
        </div>
        {role === 'branch' && (
          <Button onClick={() => navigate('/branch/cars/add')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة سيارة
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن سيارة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="available">متاحة</SelectItem>
                <SelectItem value="rented">مؤجرة</SelectItem>
                <SelectItem value="maintenance">صيانة</SelectItem>
                <SelectItem value="unavailable">غير متاحة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cars Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !cars?.length ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد سيارات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السيارة</TableHead>
                  <TableHead>السعر اليومي</TableHead>
                  <TableHead>الكمية المتاحة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {car.additional_images?.[0] && (
                          <img
                            src={car.additional_images[0]}
                            alt={car.model_name_ar || ''}
                            className="w-16 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{car.brand_name_ar} {car.model_name_ar}</p>
                          <p className="text-sm text-muted-foreground">{car.color_name_ar}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{Number(car.daily_price).toLocaleString()} ر.س</TableCell>
                    <TableCell>{car.available_quantity} من {car.quantity}</TableCell>
                    <TableCell>{getStatusBadge(car.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/branch/cars/${car.id}`)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/branch/cars/${car.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4 ml-2" />
                          تعديل
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
    </div>
  );
};

export default BranchCarsList;
