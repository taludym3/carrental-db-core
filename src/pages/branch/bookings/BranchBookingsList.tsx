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
import { Search, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingStatusBadge } from '@/pages/admin/bookings/components/BookingStatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const BranchBookingsList = () => {
  const { user } = useAuth();
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

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['branch-bookings', profile?.branch_id, search, statusFilter],
    queryFn: async () => {
      if (!profile?.branch_id) return [];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          cars (
            model_id,
            car_models (
              name_ar,
              name_en,
              brand_id,
              car_brands (
                name_ar,
                name_en
              )
            )
          )
        `)
        .eq('branch_id', profile.branch_id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (search) {
        // Search in customer name
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('full_name', `%${search}%`);
        
        if (profiles && profiles.length > 0) {
          const customerIds = profiles.map(p => p.user_id);
          query = query.in('customer_id', customerIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get customer profiles
      const customerIds = data?.map(b => b.customer_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .in('user_id', customerIds);

      // Map profiles to bookings
      return data?.map(booking => ({
        ...booking,
        customer_profile: profiles?.find(p => p.user_id === booking.customer_id)
      })) || [];
    },
    enabled: !!profile?.branch_id,
  });

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
      <div>
        <h1 className="text-3xl font-bold">إدارة الحجوزات</h1>
        <p className="text-muted-foreground">قائمة حجوزات الفرع</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن حجز..."
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
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكدة</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !bookings?.length ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد حجوزات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>السيارة</TableHead>
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customer_profile?.full_name || 'عميل'}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer_profile?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.cars?.car_models?.car_brands?.name_ar} {booking.cars?.car_models?.name_ar}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell className="font-bold">{Number(booking.final_amount).toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/branch/bookings/${booking.id}`)}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        عرض
                      </Button>
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

export default BranchBookingsList;
