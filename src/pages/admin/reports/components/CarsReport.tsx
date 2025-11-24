import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CarsReportProps {
  dateRange: { from: Date; to: Date };
  branchId: string | null;
}

export function CarsReport({ dateRange, branchId }: CarsReportProps) {
  const { data: cars, isLoading } = useQuery({
    queryKey: ["cars-performance", dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cars_performance_report", {
        p_start_date: dateRange.from.toISOString().split('T')[0],
        p_end_date: dateRange.to.toISOString().split('T')[0],
        p_branch_id: branchId,
      });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!cars || cars.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">لا توجد بيانات لعرضها</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقرير أداء السيارات</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>السيارة</TableHead>
              <TableHead>الفرع</TableHead>
              <TableHead>الحجوزات</TableHead>
              <TableHead>أيام الإيجار</TableHead>
              <TableHead>الإيرادات</TableHead>
              <TableHead>معدل الاستخدام</TableHead>
              <TableHead>متوسط السعر اليومي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>نقاط الشعبية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.car_id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{car.brand_name_ar}</div>
                    <div className="text-sm text-muted-foreground">{car.model_name_ar}</div>
                  </div>
                </TableCell>
                <TableCell>{car.branch_name_ar}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{car.total_bookings}</Badge>
                </TableCell>
                <TableCell>{car.total_rental_days}</TableCell>
                <TableCell>{car.total_revenue?.toLocaleString("ar-SA")} ر.س</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={car.utilization_rate} className="h-2" />
                    <span className="text-xs text-muted-foreground">{car.utilization_rate?.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell>{car.average_daily_rate?.toLocaleString("ar-SA")} ر.س</TableCell>
                <TableCell>
                  <Badge variant={car.availability_status === "متاحة" ? "default" : "secondary"}>
                    {car.availability_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{car.popularity_score?.toFixed(1)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}