import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BranchComparisonChart } from "./charts/BranchComparisonChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BranchesReportProps {
  dateRange: { from: Date; to: Date };
  compact?: boolean;
}

export function BranchesReport({ dateRange, compact = false }: BranchesReportProps) {
  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches-performance", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_branches_performance_report", {
        p_start_date: dateRange.from.toISOString().split('T')[0],
        p_end_date: dateRange.to.toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!branches || branches.length === 0) return null;

  return (
    <div className="space-y-6">
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>مقارنة أداء الفروع</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchComparisonChart data={branches} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل أداء الفروع</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفرع</TableHead>
                <TableHead>الحجوزات</TableHead>
                <TableHead>الإيرادات</TableHead>
                <TableHead>السيارات</TableHead>
                <TableHead>معدل الاستخدام</TableHead>
                <TableHead>نقاط الأداء</TableHead>
                <TableHead>التغيير</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.branch_id}>
                  <TableCell className="font-medium">{branch.branch_name_ar}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{branch.total_bookings}</div>
                      <div className="text-xs text-muted-foreground">
                        نشط: {branch.active_bookings} | مكتمل: {branch.completed_bookings}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{branch.total_revenue?.toLocaleString("ar-SA")} ر.س</TableCell>
                  <TableCell>
                    {branch.available_cars} / {branch.total_cars}
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.utilization_rate > 70 ? "default" : "secondary"}>
                      {branch.utilization_rate?.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{branch.performance_score?.toFixed(1)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {branch.revenue_change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={branch.revenue_change > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(branch.revenue_change)?.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}