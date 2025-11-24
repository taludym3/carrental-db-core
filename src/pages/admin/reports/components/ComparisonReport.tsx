import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonReportProps {
  dateRange: { from: Date; to: Date };
  compareMode: boolean;
}

export function ComparisonReport({ dateRange, compareMode }: ComparisonReportProps) {
  const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousStart = new Date(dateRange.from);
  previousStart.setDate(previousStart.getDate() - daysDiff);
  
  const previousEnd = new Date(dateRange.from);
  previousEnd.setDate(previousEnd.getDate() - 1);

  const { data: comparison, isLoading } = useQuery({
    queryKey: ["comparison-report", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_comparison_report", {
        p_current_start: dateRange.from.toISOString().split('T')[0],
        p_current_end: dateRange.to.toISOString().split('T')[0],
        p_previous_start: previousStart.toISOString().split('T')[0],
        p_previous_end: previousEnd.toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    },
    enabled: compareMode,
  });

  if (!compareMode) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">قم بتفعيل "مقارنة مع الفترة السابقة" لعرض التقرير</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!comparison || comparison.length === 0) return null;

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقرير المقارنة</CardTitle>
        <p className="text-sm text-muted-foreground">
          مقارنة بين الفترة الحالية ({dateRange.from.toLocaleDateString('ar-SA')} - {dateRange.to.toLocaleDateString('ar-SA')})
          والفترة السابقة ({previousStart.toLocaleDateString('ar-SA')} - {previousEnd.toLocaleDateString('ar-SA')})
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المؤشر</TableHead>
              <TableHead>القيمة الحالية</TableHead>
              <TableHead>القيمة السابقة</TableHead>
              <TableHead>التغيير</TableHead>
              <TableHead>النسبة المئوية</TableHead>
              <TableHead>الاتجاه</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.map((metric) => (
              <TableRow key={metric.metric_name}>
                <TableCell className="font-medium">{metric.metric_name}</TableCell>
                <TableCell className="text-lg font-bold">
                  {metric.current_value?.toLocaleString("ar-SA")}
                </TableCell>
                <TableCell>
                  {metric.previous_value?.toLocaleString("ar-SA")}
                </TableCell>
                <TableCell className={getTrendColor(metric.trend)}>
                  {metric.change_amount > 0 ? '+' : ''}
                  {metric.change_amount?.toLocaleString("ar-SA")}
                </TableCell>
                <TableCell>
                  <Badge variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}>
                    {metric.change_percentage > 0 ? '+' : ''}
                    {metric.change_percentage?.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  {getTrendIcon(metric.trend)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}