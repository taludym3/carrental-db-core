import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface ModelCardProps {
  model: {
    id: string;
    name_en: string;
    name_ar: string | null;
    year: number;
    default_image_url: string | null;
    is_active: boolean;
    car_brands: {
      id: string;
      name_en: string;
      name_ar: string | null;
      logo_url: string | null;
    } | null;
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ModelCard = ({ model, onView, onEdit, onDelete }: ModelCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex gap-3 mb-3">
        {model.default_image_url ? (
          <img 
            src={model.default_image_url} 
            alt={model.name_en} 
            className="h-20 w-20 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-muted-foreground">لا صورة</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{model.name_ar || model.name_en}</p>
          <p className="text-sm text-muted-foreground truncate">{model.name_en}</p>
          <div className="flex items-center gap-2 mt-1">
            {model.car_brands?.logo_url && (
              <img 
                src={model.car_brands.logo_url} 
                alt="" 
                className="h-5 w-5 object-contain"
              />
            )}
            <span className="text-sm truncate">{model.car_brands?.name_ar}</span>
            <Badge variant="outline" className="text-xs flex-shrink-0">{model.year}</Badge>
          </div>
        </div>
        
        <Badge variant={model.is_active ? 'default' : 'secondary'} className="h-fit flex-shrink-0">
          {model.is_active ? 'نشط' : 'غير نشط'}
        </Badge>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(model.id)} className="flex-1">
          <Eye className="h-4 w-4 ml-2" />
          عرض
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(model.id)} className="flex-1">
          <Pencil className="h-4 w-4 ml-2" />
          تعديل
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(model.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};
