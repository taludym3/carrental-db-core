import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { GrowthTrendChart } from "./charts/GrowthTrendChart";
import { Progress } from "@/components/ui/progress";

interface CustomersReportProps {
  dateRange: { from: Date; to: Date };
}

export function CustomersReport({ dateRange }: CustomersReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["customers-report", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_customers_report", {
        p_start_date: dateRange.from.toISOString().split('T')[0],
        p_end_date: dateRange.to.toISOString().split('T')[0],
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
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{report.total_customers}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عملاء موثقين</span>
                <span className="font-medium">{report.verified_customers}</span>
              </div>
              <Progress value={report.verification_rate} className="h-2" />
              <p className="text-xs text-muted-foreground">معدل التوثيق: {report.verification_rate?.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>العملاء النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{report.active_customers}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">عملاء لديهم حجوزات</span>
                <span className="font-medium">{report.customers_with_bookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">عملاء متكررون</span>
                <span className="font-medium">{report.repeat_customers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>متوسط قيمة العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{report.average_customer_value?.toLocaleString("ar-SA")} ر.س</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">عملاء عاليو القيمة</span>
                <span className="font-medium">{report.high_value_customers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نمو العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <GrowthTrendChart data={Array.isArray(report.growth_timeline) ? report.growth_timeline : []} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {report.gender_distribution && Array.isArray(report.gender_distribution) && (
          <Card>
            <CardHeader>
              <CardTitle>توزيع العملاء حسب الجنس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(report.gender_distribution as any[]).map((item: any) => (
                  <div key={item.gender} className="flex items-center justify-between">
                    <span>{item.gender}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {report.age_distribution && Array.isArray(report.age_distribution) && (
          <Card>
            <CardHeader>
              <CardTitle>توزيع العملاء حسب الفئة العمرية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(report.age_distribution as any[]).map((item: any) => (
                  <div key={item.age_group} className="flex items-center justify-between">
                    <span>{item.age_group}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}