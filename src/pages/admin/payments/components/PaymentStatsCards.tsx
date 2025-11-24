import { Card } from "@/components/ui/card";
import { DollarSign, Clock, RefreshCcw, XCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentStatsCardsProps {
  stats: {
    total_completed: number;
    total_pending: number;
    total_refunded: number;
    total_failed: number;
    count_completed: number;
    count_pending: number;
    count_refunded: number;
    count_failed: number;
    total_today: number;
    count_today: number;
    avg_payment_amount: number;
  } | undefined;
  isLoading: boolean;
}

export const PaymentStatsCards = ({ stats, isLoading }: PaymentStatsCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20 mt-2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "إجمالي المدفوعات المكتملة",
      value: `${stats.total_completed.toLocaleString()} ريال`,
      subtitle: `${stats.count_completed} عملية`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      title: "المدفوعات المعلقة",
      value: `${stats.total_pending.toLocaleString()} ريال`,
      subtitle: `${stats.count_pending} عملية`,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "المبالغ المسترجعة",
      value: `${stats.total_refunded.toLocaleString()} ريال`,
      subtitle: `${stats.count_refunded} عملية`,
      icon: RefreshCcw,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "مدفوعات اليوم",
      value: `${stats.total_today.toLocaleString()} ريال`,
      subtitle: `${stats.count_today} عملية`,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </Card>
        );
      })}
    </div>
  );
};
