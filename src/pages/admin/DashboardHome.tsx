import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Car, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const DashboardHome = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [usersRes, carsRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('cars').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id, final_amount', { count: 'exact' }),
      ]);

      const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + (Number(b.final_amount) || 0), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalCars: carsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalRevenue,
      };
    },
  });

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

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.totalUsers || 0,
      icon: Users,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'إجمالي السيارات',
      value: stats?.totalCars || 0,
      icon: Car,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'إجمالي الحجوزات',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats?.totalRevenue.toLocaleString('ar-SA')} ر.س`,
      icon: DollarSign,
      trend: '+18%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم الرئيسية</h1>
        <p className="text-muted-foreground mt-1">مرحباً بك في نظام إدارة LEAGO</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs flex items-center gap-1 mt-1 ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{stat.trend} من الشهر الماضي</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              سيتم إضافة الرسوم البيانية قريباً
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>آخر الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              سيتم إضافة الجدول قريباً
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
