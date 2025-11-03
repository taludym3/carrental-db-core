import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";

interface ColorCardProps {
  color: {
    id: string;
    name_en: string;
    name_ar: string | null;
    hex_code: string | null;
    is_active: boolean;
    created_at: string;
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ColorCard = ({ color, onView, onEdit, onDelete }: ColorCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-16 h-16 rounded-lg border-2 shadow-sm flex-shrink-0"
          style={{ backgroundColor: color.hex_code || '#ccc' }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{color.name_ar || color.name_en}</p>
          <p className="text-sm text-muted-foreground truncate">{color.name_en}</p>
          <code className="text-xs bg-muted px-2 py-1 rounded inline-block mt-1">
            {color.hex_code}
          </code>
        </div>
        <Badge variant={color.is_active ? 'default' : 'secondary'} className="flex-shrink-0">
          {color.is_active ? 'نشط' : 'غير نشط'}
        </Badge>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        {new Date(color.created_at).toLocaleDateString('ar-SA')}
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(color.id)} className="flex-1">
          <Eye className="h-4 w-4 ml-2" />
          عرض
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(color.id)} className="flex-1">
          <Edit className="h-4 w-4 ml-2" />
          تعديل
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(color.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
