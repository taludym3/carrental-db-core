import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye } from "lucide-react";
import { DocumentStatusBadge } from "@/pages/admin/bookings/components/DocumentStatusBadge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DocumentCardProps {
  doc: any;
  onView: (id: string) => void;
  getDocumentTypeName: (type: string) => string;
}

export const DocumentCard = ({ doc, onView, getDocumentTypeName }: DocumentCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {doc.user_name?.charAt(0) || 'م'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{doc.user_name}</p>
            <p className="text-xs text-muted-foreground">{doc.user_email}</p>
          </div>
        </div>
        <DocumentStatusBadge status={doc.document_status} />
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">نوع المستند:</span>
          <span className="font-medium">{getDocumentTypeName(doc.document_type)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">رقم الهاتف:</span>
          <span>{doc.user_phone || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">التاريخ:</span>
          <span>{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}</span>
        </div>
        {doc.verified_by_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">راجعه:</span>
            <span>{doc.verified_by_name}</span>
          </div>
        )}
      </div>
      
      <Button className="w-full mt-3" size="sm" onClick={() => onView(doc.document_id)}>
        <Eye className="h-4 w-4 ml-2" />
        عرض التفاصيل
      </Button>
    </Card>
  );
};
