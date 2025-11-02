import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

interface UsersEmptyStateProps {
  hasSearch: boolean;
}

export const UsersEmptyState = ({ hasSearch }: UsersEmptyStateProps) => {
  return (
    <div className="text-center py-12 px-4">
      <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">لا يوجد مستخدمون</h3>
      <p className="text-muted-foreground mb-4">
        {hasSearch ? 'لم يتم العثور على نتائج مطابقة' : 'ابدأ بإضافة مستخدم جديد'}
      </p>
      {!hasSearch && (
        <Button asChild>
          <Link to="/admin/users/add">
            <Plus className="ml-2 h-4 w-4" />
            إضافة مستخدم
          </Link>
        </Button>
      )}
    </div>
  );
};
