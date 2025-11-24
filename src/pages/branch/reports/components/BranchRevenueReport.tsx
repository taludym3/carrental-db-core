import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { RevenueChart } from '@/pages/admin/reports/components/charts/RevenueChart';
import { PaymentMethodsChart } from '@/pages/admin/reports/components/charts/PaymentMethodsChart';

interface BranchRevenueReportProps {
  dateRange: { from: Date; to: Date };
  branchId: string;
}

export function BranchRevenueReport({ dateRange, branchId }: BranchRevenueReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['branch-revenue-report', dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_report', {
        p_start_date: dateRange.from.toISOString().split('T')[0],
        p_end_date: dateRange.to.toISOString().split('T')[0],
        p_branch_id: branchId,
        p_group_by: 'day',
      });

      if (error) throw error;
      return data?.[0];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تقرير الإيرادات التفصيلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold">{report.total_revenue?.toLocaleString('ar-SA')} ر.س</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدفوعات المكتملة</p>
              <p className="text-2xl font-bold text-green-600">{report.total_paid?.toLocaleString('ar-SA')} ر.س</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدفوعات المعلقة</p>
              <p className="text-2xl font-bold text-yellow-600">{report.total_pending?.toLocaleString('ar-SA')} ر.س</p>
            </div>
          </div>

          <h3 className="text-sm font-medium mb-3">الرسم البياني للإيرادات</h3>
          <RevenueChart data={Array.isArray(report.time_series) ? report.time_series : []} />
        </CardContent>
      </Card>

      {report.payment_methods_breakdown && Array.isArray(report.payment_methods_breakdown) && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع طرق الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodsChart data={report.payment_methods_breakdown} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
