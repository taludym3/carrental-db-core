import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DocumentsReportProps {
  dateRange: { from: Date; to: Date };
}

export function DocumentsReport({ dateRange }: DocumentsReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ["documents-report", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_documents_report", {
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

  const formatInterval = (interval: string) => {
    if (!interval) return "غير متوفر";
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (!match) return interval;
    const [_, hours, minutes] = match;
    return `${hours} ساعة ${minutes} دقيقة`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي الوثائق</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{report.total_documents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قيد المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{report.pending_documents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>موافق عليها</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{report.approved_documents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مرفوضة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{report.rejected_documents}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معدل الموافقة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={report.approval_rate} className="h-3" />
            <p className="text-2xl font-bold">{report.approval_rate?.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              من إجمالي الوثائق التي تم مراجعتها
            </p>
          </div>
        </CardContent>
      </Card>

      {report.document_types_breakdown && Array.isArray(report.document_types_breakdown) && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع أنواع الوثائق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(report.document_types_breakdown as any[]).map((type: any) => (
                <div key={type.document_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.document_type}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        إجمالي: {type.total}
                      </Badge>
                      <Badge variant="default">
                        موافق: {type.approved}
                      </Badge>
                      <Badge variant="destructive">
                        مرفوض: {type.rejected}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(type.approved / type.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report.verification_stats && typeof report.verification_stats === 'object' && (
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات وقت التحقق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">أسرع تحقق</p>
                <p className="text-lg font-bold">{formatInterval((report.verification_stats as any).fastest)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">متوسط التحقق</p>
                <p className="text-lg font-bold">{formatInterval((report.verification_stats as any).average)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">أبطأ تحقق</p>
                <p className="text-lg font-bold">{formatInterval((report.verification_stats as any).slowest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}