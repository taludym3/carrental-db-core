import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookingStatusBadge } from '@/pages/admin/bookings/components/BookingStatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const BranchDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get branch_id for current user
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

  // Get branch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['branch-stats', profile?.branch_id],
    queryFn: async () => {
      if (!profile?.branch_id) return null;

      const [carsResult, bookingsResult] = await Promise.all([
        supabase.from('cars').select('id', { count: 'exact' }).eq('branch_id', profile.branch_id),
        supabase.from('bookings').select('id, final_amount', { count: 'exact' }).eq('branch_id', profile.branch_id).eq('status', 'active'),
      ]);

      const totalRevenue = bookingsResult.data?.reduce((sum, booking) => sum + Number(booking.final_amount || 0), 0) || 0;

      return {
        totalCars: carsResult.count || 0,
        activeBookings: bookingsResult.count || 0,
        totalRevenue,
      };
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة تحكم الفرع</h1>
        <p className="text-muted-foreground">نظرة عامة على أداء الفرع</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السيارات</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalCars || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحجوزات النشطة</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.activeBookings || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalRevenue.toLocaleString()} ر.س</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>آخر الحجوزات</CardTitle>
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
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/branch/bookings/${booking.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {booking.customer_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.cars?.car_models?.car_brands?.name_ar} {booking.cars?.car_models?.name_ar}
                    </p>
                  </div>
                  <div className="text-left space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.start_date), 'dd MMM yyyy', { locale: ar })}
                    </p>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <div className="text-left mr-4">
                    <p className="font-bold text-primary">{Number(booking.final_amount).toLocaleString()} ر.س</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchDashboardHome;
