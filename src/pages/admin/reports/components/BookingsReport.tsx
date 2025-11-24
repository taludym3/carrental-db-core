import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingsChart } from "./charts/BookingsChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BookingsReportProps {
  dateRange: { from: Date; to: Date };
  branchId: string | null;
  compact?: boolean;
}

export function BookingsReport({ dateRange, branchId, compact = false }: BookingsReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["bookings-report", dateRange, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_bookings_report", {
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

  if (!report) return null;

  const statusData = [
    { status: "مكتملة", count: report.completed_bookings, color: "bg-green-500" },
    { status: "نشطة", count: report.active_bookings, color: "bg-blue-500" },
    { status: "قيد الانتظار", count: report.pending_bookings, color: "bg-yellow-500" },
    { status: "ملغاة", count: report.cancelled_bookings, color: "bg-red-500" },
    { status: "مرفوضة", count: report.rejected_bookings, color: "bg-gray-500" },
  ];

  const rentalTypeData = [
    { type: "يومي", count: report.daily_rentals },
    { type: "أسبوعي", count: report.weekly_rentals },
    { type: "شهري", count: report.monthly_rentals },
    { type: "تمليك", count: report.ownership_rentals },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>تقرير الحجوزات التفصيلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-3">توزيع الحجوزات حسب الحالة</h3>
              <div className="space-y-2">
                {statusData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.status}</span>
                    </div>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">توزيع حسب نوع الإيجار</h3>
              <div className="space-y-2">
                {rentalTypeData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm">{item.type}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!compact && (
            <>
              <h3 className="text-sm font-medium mb-3">الرسم البياني للحجوزات</h3>
              <BookingsChart data={Array.isArray(report.daily_breakdown) ? report.daily_breakdown : []} />
            </>
          )}
        </CardContent>
      </Card>

      {!compact && report.branch_breakdown && Array.isArray(report.branch_breakdown) && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع الحجوزات حسب الفرع</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفرع</TableHead>
                  <TableHead>عدد الحجوزات</TableHead>
                  <TableHead>الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report.branch_breakdown as any[]).map((branch: any) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell>{branch.branch_name}</TableCell>
                    <TableCell>{branch.bookings_count}</TableCell>
                    <TableCell>{branch.revenue?.toLocaleString("ar-SA")} ر.س</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}