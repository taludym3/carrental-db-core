import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface BranchStatsCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  description?: string;
}

export function BranchStatsCard({
  icon: Icon,
  title,
  value,
  description,
}: BranchStatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
