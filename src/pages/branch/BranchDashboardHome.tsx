import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, CarFront, Calendar, Clock, DollarSign, TrendingUp, Plus, FileText, BarChart3, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookingStatusBadge } from '@/pages/admin/bookings/components/BookingStatusBadge';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BranchDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get branch_id and branch info for current user
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

  // Get branch details
  const { data: branchInfo } = useQuery({
    queryKey: ['branch-info', profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return null;

      const { data, error } = await supabase
        .from('branches')
        .select('name_ar, name_en')
        .eq('id', profile.branch_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.branch_id,
  });

  // Get enhanced branch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['branch-stats', profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return null;

      const [
        carsResult, 
        availableCarsResult,
        activeBookingsResult, 
        pendingBookingsResult,
        allBookingsResult
      ] = await Promise.all([
        supabase.from('cars').select('id', { count: 'exact' }).eq('branch_id', profile.branch_id),
        supabase.from('cars').select('id', { count: 'exact' }).eq('branch_id', profile.branch_id).eq('status', 'available'),
        supabase.from('bookings').select('id, final_amount', { count: 'exact' }).eq('branch_id', profile.branch_id).eq('status', 'active'),
        supabase.from('bookings').select('id', { count: 'exact' }).eq('branch_id', profile.branch_id).eq('status', 'pending'),
        supabase.from('bookings').select('final_amount').eq('branch_id', profile.branch_id).eq('status', 'active'),
      ]);

      const totalRevenue = allBookingsResult.data?.reduce((sum, booking) => sum + Number(booking.final_amount || 0), 0) || 0;
      const avgBookingValue = allBookingsResult.data && allBookingsResult.data.length > 0 
        ? totalRevenue / allBookingsResult.data.length 
        : 0;

      return {
        totalCars: carsResult.count || 0,
        availableCars: availableCarsResult.count || 0,
        activeBookings: activeBookingsResult.count || 0,
        pendingBookings: pendingBookingsResult.count || 0,
        totalRevenue,
        avgBookingValue,
      };
    },
    enabled: !!profile?.branch_id,
  });

  // Get revenue chart data (last 6 months)
  const { data: revenueChartData, isLoading: chartLoading } = useQuery({
    queryKey: ['branch-revenue-chart', profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return [];

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { data } = await supabase
          .from('bookings')
          .select('final_amount')
          .eq('branch_id', profile.branch_id)
          .eq('status', 'active')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());

        const revenue = data?.reduce((sum, booking) => sum + Number(booking.final_amount || 0), 0) || 0;

        months.push({
          date: format(date, 'MMM yyyy', { locale: ar }),
          revenue,
        });
      }

      return months;
    },
    enabled: !!profile?.branch_id,
  });

  // Get recent bookings
  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['recent-bookings', profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          final_amount,
          customer_id,
          car_id,
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
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get customer profiles separately
      const customerIds = data?.map(b => b.customer_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', customerIds);

      // Map profiles to bookings
      return data?.map(booking => ({
        ...booking,
        customer_name: profiles?.find(p => p.user_id === booking.customer_id)?.full_name || 'عميل'
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

  const statsCards = [
    { 
      title: 'إجمالي السيارات', 
      value: stats?.totalCars || 0, 
      icon: Car, 
      color: 'text-blue-600 bg-blue-600/10' 
    },
    { 
      title: 'السيارات المتاحة', 
      value: stats?.availableCars || 0, 
      icon: CarFront, 
      color: 'text-green-600 bg-green-600/10' 
    },
    { 
      title: 'الحجوزات النشطة', 
      value: stats?.activeBookings || 0, 
      icon: Calendar, 
      color: 'text-primary bg-primary/10' 
    },
    { 
      title: 'الحجوزات المعلقة', 
      value: stats?.pendingBookings || 0, 
      icon: Clock, 
      color: 'text-orange-600 bg-orange-600/10' 
    },
    { 
      title: 'إجمالي الإيرادات', 
      value: `${(stats?.totalRevenue || 0).toLocaleString()} ر.س`, 
      icon: DollarSign, 
      color: 'text-emerald-600 bg-emerald-600/10' 
    },
    { 
      title: 'متوسط قيمة الحجز', 
      value: `${(stats?.avgBookingValue || 0).toLocaleString()} ر.س`, 
      icon: TrendingUp, 
      color: 'text-purple-600 bg-purple-600/10' 
    },
  ];

  const quickActions = [
    { label: 'إضافة سيارة', icon: Plus, path: '/branch/cars/add' },
    { label: 'الحجوزات', icon: FileText, path: '/branch/bookings' },
    { label: 'التقارير', icon: BarChart3, path: '/branch/reports' },
    { label: 'الإعدادات', icon: Settings, path: '/branch/settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {branchInfo ? `لوحة تحكم فرع ${branchInfo.name_ar || branchInfo.name_en}` : 'لوحة تحكم الفرع'}
        </h1>
        <p className="text-muted-foreground">مرحباً بك في نظام إدارة الفرع</p>
      </div>

      {/* Stats Cards - 6 Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>نظرة على الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !revenueChartData || revenueChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              لا توجد بيانات لعرضها
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>آخر الحجوزات</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/branch/bookings')}
          >
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !recentBookings?.length ? (
            <p className="text-center text-muted-foreground py-8">لا توجد حجوزات</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>السيارة</TableHead>
                    <TableHead>تاريخ البداية</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/branch/bookings/${booking.id}`)}
                    >
                      <TableCell className="font-medium">
                        {booking.customer_name}
                      </TableCell>
                      <TableCell>
                        {booking.cars?.car_models?.car_brands?.name_ar} {booking.cars?.car_models?.name_ar}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {Number(booking.final_amount).toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchDashboardHome;
