import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MapPin, Phone, User } from 'lucide-react';

interface BranchCardProps {
  branch: {
    id: string;
    name_ar: string | null;
    name_en: string;
    location_ar: string | null;
    location_en: string;
    phone: string;
    is_active: boolean;
    manager?: {
      full_name: string | null;
    };
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BranchCard({ branch, onView, onEdit, onDelete }: BranchCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">
              {branch.name_ar || branch.name_en}
            </h3>
            {branch.name_en && branch.name_ar && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {branch.name_en}
              </p>
            )}
          </div>
          <Badge variant={branch.is_active ? 'default' : 'secondary'}>
            {branch.is_active ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="line-clamp-2">{branch.location_ar || branch.location_en}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{branch.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">-</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(branch.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 ml-2" />
            عرض
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(branch.id)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(branch.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
