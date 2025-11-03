import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface BrandCardProps {
  brand: {
    id: string;
    name_en: string;
    name_ar: string | null;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const BrandCard = ({ brand, onView, onEdit, onDelete }: BrandCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        {brand.logo_url ? (
          <img 
            src={brand.logo_url} 
            alt={brand.name_en} 
            className="h-16 w-16 object-contain rounded border p-2 flex-shrink-0"
          />
        ) : (
          <div className="h-16 w-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
            <span className="text-xs">لا شعار</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{brand.name_ar || brand.name_en}</p>
          <p className="text-sm text-muted-foreground truncate">{brand.name_en}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(brand.created_at).toLocaleDateString('ar-SA')}
          </p>
        </div>
        
        <Badge variant={brand.is_active ? 'default' : 'secondary'} className="flex-shrink-0">
          {brand.is_active ? 'نشط' : 'غير نشط'}
        </Badge>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(brand.id)} className="flex-1">
          <Eye className="h-4 w-4 ml-2" />
          عرض
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(brand.id)} className="flex-1">
          <Pencil className="h-4 w-4 ml-2" />
          تعديل
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(brand.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
