import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, FileText, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BranchSummaryCardsProps {
  dateRange: { from: Date; to: Date };
  branchId: string;
}

export function BranchSummaryCards({ dateRange, branchId }: BranchSummaryCardsProps) {
  const { data: bookingsReport, isLoading: bookingsLoading } = useQuery({
    queryKey: ['branch-bookings-summary', dateRange, branchId],
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

  const { data: revenueReport, isLoading: revenueLoading } = useQuery({
    queryKey: ['branch-revenue-summary', dateRange, branchId],
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

  const cards = [
    {
      title: 'إجمالي الإيرادات',
      value: revenueReport?.total_paid || 0,
      icon: DollarSign,
      format: 'currency',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'إجمالي الحجوزات',
      value: bookingsReport?.total_bookings || 0,
      icon: FileText,
      format: 'number',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'معدل التحويل',
      value: bookingsReport?.conversion_rate || 0,
      icon: Percent,
      format: 'percentage',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'متوسط قيمة الحجز',
      value: bookingsReport?.average_booking_value || 0,
      icon: TrendingUp,
      format: 'currency',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return `${value.toLocaleString('ar-SA')} ر.س`;
    } else if (format === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('ar-SA');
  };

  if (bookingsLoading || revenueLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <p className="text-2xl font-bold mt-1">{formatValue(card.value, card.format)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
