import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./charts/RevenueChart";
import { PaymentMethodsChart } from "./charts/PaymentMethodsChart";

interface RevenueReportProps {
  dateRange: { from: Date; to: Date };
  branchId: string | null;
  compact?: boolean;
}

export function RevenueReport({ dateRange, branchId, compact = false }: RevenueReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["revenue-report", dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_revenue_report", {
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
              <p className="text-2xl font-bold">{report.total_revenue?.toLocaleString("ar-SA")} ر.س</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدفوعات المكتملة</p>
              <p className="text-2xl font-bold text-green-600">{report.total_paid?.toLocaleString("ar-SA")} ر.س</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدفوعات المعلقة</p>
              <p className="text-2xl font-bold text-yellow-600">{report.total_pending?.toLocaleString("ar-SA")} ر.س</p>
            </div>
          </div>

          {!compact && (
            <>
              <h3 className="text-sm font-medium mb-3">الرسم البياني للإيرادات</h3>
              <RevenueChart data={Array.isArray(report.time_series) ? report.time_series : []} />
            </>
          )}
        </CardContent>
      </Card>

      {!compact && report.payment_methods_breakdown && Array.isArray(report.payment_methods_breakdown) && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>توزيع طرق الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodsChart data={Array.isArray(report.payment_methods_breakdown) ? report.payment_methods_breakdown : []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>أعلى 5 فروع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(report.top_branches) && (report.top_branches as any[]).map((branch: any, index: number) => (
                  <div key={branch.branch_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{branch.branch_name}</span>
                    </div>
                    <span className="text-lg font-bold">{branch.revenue?.toLocaleString("ar-SA")} ر.س</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}