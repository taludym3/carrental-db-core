import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardHome = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [usersResult, carsResult, bookingsResult, revenueResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase
          .from('bookings')
          .select('final_amount')
          .in('status', ['completed', 'active']),
      ]);

      const revenue = revenueResult.data?.reduce((sum, booking) => sum + (Number(booking.final_amount) || 0), 0) || 0;

      return {
        users: usersResult.count || 0,
        cars: carsResult.count || 0,
        bookings: bookingsResult.count || 0,
        revenue,
      };
    },
  });

  // رسم بياني للإيرادات
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from('bookings')
        .select('final_amount, created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .in('status', ['completed', 'active']);

      // تجميع حسب الشهر
      const monthlyRevenue: Record<string, number> = {};
      
      data?.forEach((booking) => {
        const date = new Date(booking.created_at);
        const month = date.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(booking.final_amount) || 0);
      });

      return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    },
  });

  // آخر الحجوزات
  const { data: recentBookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_bookings_admin', {
        p_limit: 5
      });
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      confirmed: { label: 'مؤكد', variant: 'default' },
      payment_pending: { label: 'بانتظار الدفع', variant: 'secondary' },
      active: { label: 'نشط', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'default' },
      cancelled: { label: 'ملغي', variant: 'destructive' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم الرئيسية</h1>
        <p className="text-muted-foreground mt-1">مرحباً بك في نظام إدارة LEAGO</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السيارات</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cars || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحجوزات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookings || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.revenue?.toLocaleString('ar-SA') || 0} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            نظرة عامة على الإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRevenue ? (
            <Skeleton className="h-[300px] w-full" />
          ) : revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString('ar-SA')} ر.س`}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              لا توجد بيانات إيرادات حالياً
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>آخر الحجوزات</CardTitle>
            <Link to="/admin/bookings">
              <span className="text-sm text-primary hover:underline">عرض الكل</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentBookings && recentBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>السيارة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking: any) => (
                  <TableRow key={booking.booking_id}>
                    <TableCell>{booking.customer_name}</TableCell>
                    <TableCell>
                      {booking.car_brand_ar} {booking.car_model_ar}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.start_date).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      {Number(booking.final_amount).toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد حجوزات حالياً
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
