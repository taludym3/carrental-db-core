import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { DocumentPreview } from "./DocumentPreview";
import { ApproveDocumentDialog } from "./ApproveDocumentDialog";
import { RejectDocumentDialog } from "./RejectDocumentDialog";
import { DocumentStatusBadge } from "../../bookings/components/DocumentStatusBadge";
import { ChangeDocumentStatusDialog } from "./ChangeDocumentStatusDialog";

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

interface DocumentReviewCardProps {
  document: Document;
  isSelected: boolean;
  onSelect: (documentId: string) => void;
  onStatusChange?: () => void;
}

const getDocumentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    national_id: "الهوية الوطنية",
    drivers_license: "رخصة القيادة",
    passport: "جواز السفر",
    residency_permit: "الإقامة",
    vehicle_registration: "رخصة السيارة",
  };
  return labels[type] || type;
};

export function DocumentReviewCard({
  document,
  isSelected,
  onSelect,
  onStatusChange,
}: DocumentReviewCardProps) {
  const isPending = document.status === "pending";
  const status = document.status as "pending" | "approved" | "rejected";

  return (
    <Card className={isSelected && isPending ? "ring-2 ring-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isPending && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(document.id)}
              />
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {getDocumentTypeLabel(document.document_type)}
              </CardTitle>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(document.created_at), "dd MMMM yyyy", {
                  locale: ar,
                })}
              </div>
            </div>
          </div>
          <DocumentStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document Preview */}
        <DocumentPreview url={document.document_url} type={document.document_type} />

        {/* Rejection Reason */}
        {document.status === "rejected" && document.rejection_reason && (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">سبب الرفض:</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {document.rejection_reason}
              </p>
            </div>
            <ChangeDocumentStatusDialog 
              documentId={document.id} 
              currentStatus={status}
              onSuccess={onStatusChange}
            />
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-2">
            <div className="flex-1">
              <ApproveDocumentDialog 
                documentId={document.id}
                onSuccess={onStatusChange}
              />
            </div>
            <div className="flex-1">
              <RejectDocumentDialog 
                documentId={document.id}
                onSuccess={onStatusChange}
              />
            </div>
          </div>
        )}

        {document.status === "approved" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              تمت الموافقة على هذا المستند
            </div>
            <ChangeDocumentStatusDialog 
              documentId={document.id} 
              currentStatus={status}
              onSuccess={onStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
