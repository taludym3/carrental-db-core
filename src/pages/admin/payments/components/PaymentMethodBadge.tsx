import { Badge } from "@/components/ui/badge";
import { Banknote, CreditCard, Building2, Smartphone } from "lucide-react";

interface PaymentMethodBadgeProps {
  method: string;
}

export const PaymentMethodBadge = ({ method }: PaymentMethodBadgeProps) => {
  const getMethodConfig = () => {
    switch (method) {
      case 'cash':
        return {
          label: 'نقدي',
          icon: Banknote,
          className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        };
      case 'card':
        return {
          label: 'بطاقة',
          icon: CreditCard,
          className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
        };
      case 'bank_transfer':
        return {
          label: 'تحويل بنكي',
          icon: Building2,
          className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
        };
      case 'online':
        return {
          label: 'دفع إلكتروني',
          icon: Smartphone,
          className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
        };
      default:
        return {
          label: method,
          icon: Banknote,
          className: ''
        };
    }
  };

  const config = getMethodConfig();
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
