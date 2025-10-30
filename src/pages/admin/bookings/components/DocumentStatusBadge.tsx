import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DocumentStatus = Database['public']['Enums']['document_status'];

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

const statusConfig: Record<DocumentStatus, { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive';
  icon: React.ElementType;
  className: string;
}> = {
  pending: {
    label: 'قيد المراجعة',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  approved: {
    label: 'مقبول',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
  },
  rejected: {
    label: 'مرفوض',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
  }
};

export const DocumentStatusBadge = ({ status }: DocumentStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 ml-1" />
      {config.label}
    </Badge>
  );
};
