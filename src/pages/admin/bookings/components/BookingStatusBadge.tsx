import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, CreditCard, PlayCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

const statusConfig: Record<BookingStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ElementType;
  className: string;
}> = {
  pending: {
    label: 'في الانتظار',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  confirmed: {
    label: 'مؤكد',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
  },
  payment_pending: {
    label: 'ينتظر الدفع',
    variant: 'secondary',
    icon: CreditCard,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
  },
  active: {
    label: 'نشط',
    variant: 'default',
    icon: PlayCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
  },
  completed: {
    label: 'مكتمل',
    variant: 'default',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
  },
  cancelled: {
    label: 'ملغي',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
  },
  expired: {
    label: 'منتهي',
    variant: 'secondary',
    icon: AlertCircle,
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
  }
};

export const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 ml-1" />
      {config.label}
    </Badge>
  );
};
