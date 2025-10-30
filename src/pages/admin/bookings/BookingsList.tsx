import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingStatusBadge } from './components/BookingStatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const BookingsList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          start_date,
          end_date,
          total_days,
          final_amount,
          created_at,
          customer_id,
          car_id,
          branch_id
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab as any);
      }

      const { data: bookingsData, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;
      
      if (!bookingsData || bookingsData.length === 0) return [];

      // Fetch related data
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const [customerData, carData, branchData] = await Promise.all([
            supabase.from('profiles').select('full_name, email, phone').eq('user_id', booking.customer_id).single(),
            supabase.from('cars').select(`
              id,
              model:car_models(
                name_ar,
                year,
                brand:car_brands(name_ar)
              ),
              color:car_colors(name_ar)
            `).eq('id', booking.car_id).single(),
            supabase.from('branches').select('name_ar').eq('id', booking.branch_id).single()
          ]);

          return {
            ...booking,
            customer: customerData.data,
            car: carData.data,
            branch: branchData.data
          };
        })
      );

      return enrichedBookings;
    }
  });

  const getStatusCount = (status: string) => {
    if (!bookings) return 0;
    return bookings.filter(b => b.status === status).length;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الحجوزات"
        action={
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">
            في الانتظار
            {getStatusCount('pending') > 0 && (
              <Badge variant="secondary" className="mr-2">
                {getStatusCount('pending')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">مؤكدة</TabsTrigger>
          <TabsTrigger value="payment_pending">ينتظر الدفع</TabsTrigger>
          <TabsTrigger value="active">نشطة</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled">ملغاة</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الحجز</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>السيارة</TableHead>
                  <TableHead>الفرع</TableHead>
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>المبلغ النهائي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(10).fill(0).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : bookings && bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {booking.customer?.full_name?.charAt(0) || 'ع'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{booking.customer?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.customer?.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.car?.model?.brand?.name_ar} {booking.car?.model?.name_ar} {booking.car?.model?.year}
                      </TableCell>
                      <TableCell>{booking.branch?.name_ar}</TableCell>
                      <TableCell>
                        {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.end_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>{booking.total_days} يوم</TableCell>
                      <TableCell className="font-semibold">
                        {booking.final_amount?.toLocaleString('ar-SA')} ريال
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا توجد حجوزات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsList;
