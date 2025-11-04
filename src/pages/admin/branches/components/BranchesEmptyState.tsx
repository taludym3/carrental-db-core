import { Building2 } from 'lucide-react';

interface BranchesEmptyStateProps {
  hasSearch: boolean;
}

export function BranchesEmptyState({ hasSearch }: BranchesEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">
        {hasSearch ? 'لا توجد نتائج' : 'لا توجد فروع'}
      </h3>
      <p className="text-muted-foreground">
        {hasSearch
          ? 'لم يتم العثور على فروع مطابقة لبحثك'
          : 'لم يتم إضافة أي فرع بعد'}
      </p>
    </div>
  );
}
