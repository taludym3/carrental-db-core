import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BranchCarsReportProps {
  dateRange: { from: Date; to: Date };
  branchId: string;
}

export function BranchCarsReport({ dateRange, branchId }: BranchCarsReportProps) {
  const { data: carsReport, isLoading } = useQuery({
    queryKey: ['branch-cars-report', dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cars_performance_report', {
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

  if (!carsReport || carsReport.length === 0) {
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>السيارة</TableHead>
                <TableHead className="text-center">عدد الحجوزات</TableHead>
                <TableHead className="text-center">أيام الإيجار</TableHead>
                <TableHead className="text-center">الإيرادات</TableHead>
                <TableHead className="text-center">معدل الاستخدام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {carsReport.map((car: any) => (
                <TableRow key={car.car_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{car.brand_name_ar} {car.model_name_ar}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{car.total_bookings}</TableCell>
                  <TableCell className="text-center">{car.total_rental_days}</TableCell>
                  <TableCell className="text-center font-medium">
                    {Number(car.total_revenue).toLocaleString('ar-SA')} ر.س
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${Math.min(car.utilization_rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{car.utilization_rate?.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
