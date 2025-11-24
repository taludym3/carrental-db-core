import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, RefreshCcw, AlertCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: string;
}

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: 'مكتملة',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400'
        };
      case 'pending':
        return {
          label: 'قيد الانتظار',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400'
        };
      case 'failed':
        return {
          label: 'فاشلة',
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400'
        };
      case 'refunded':
        return {
          label: 'مسترجعة',
          variant: 'outline' as const,
          icon: RefreshCcw,
          className: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400'
        };
      case 'partial_refund':
        return {
          label: 'استرجاع جزئي',
          variant: 'outline' as const,
          icon: AlertCircle,
          className: 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-400'
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: Clock,
          className: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
