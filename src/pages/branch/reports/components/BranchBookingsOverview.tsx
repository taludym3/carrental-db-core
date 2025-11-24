import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingsChart } from '@/pages/admin/reports/components/charts/BookingsChart';

interface BranchBookingsOverviewProps {
  dateRange: { from: Date; to: Date };
  branchId: string;
}

export function BranchBookingsOverview({ dateRange, branchId }: BranchBookingsOverviewProps) {
  const { data: bookingsReport, isLoading } = useQuery({
    queryKey: ['branch-bookings-overview', dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bookings_report', {
        p_start_date: dateRange.from.toISOString().split('T')[0],
        p_end_date: dateRange.to.toISOString().split('T')[0],
        p_branch_id: branchId,
        p_status: null,
      });

      if (error) throw error;
      return data?.[0];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!bookingsReport) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">إجمالي الحجوزات</p>
            <p className="text-2xl font-bold">{bookingsReport.total_bookings || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الحجوزات النشطة</p>
            <p className="text-2xl font-bold text-green-600">{bookingsReport.active_bookings || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الحجوزات المكتملة</p>
            <p className="text-2xl font-bold text-blue-600">{bookingsReport.completed_bookings || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">الحجوزات الملغاة</p>
            <p className="text-2xl font-bold text-red-600">{bookingsReport.cancelled_bookings || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الرسم البياني للحجوزات</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsChart data={Array.isArray(bookingsReport.daily_breakdown) ? bookingsReport.daily_breakdown : []} />
        </CardContent>
      </Card>
    </div>
  );
}
