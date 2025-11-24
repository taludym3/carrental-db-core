import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  totalPending: number;
  onSelectAll: () => void;
  onApproveAll: () => void;
  onRejectAll: (reason: string) => void;
  isLoading: boolean;
}

export function BulkActionsBar({
  selectedCount,
  totalPending,
  onSelectAll,
  onApproveAll,
  onRejectAll,
  isLoading,
}: BulkActionsBarProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleRejectAll = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onRejectAll(rejectionReason);
    setRejectionReason("");
    setIsRejectDialogOpen(false);
  };

  const allSelected = selectedCount === totalPending;

  return (
    <Card className="bg-muted/50">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                disabled={isLoading}
              />
              <span className="text-sm font-medium">
                {selectedCount > 0
                  ? `${selectedCount} مستند محدد`
                  : "تحديد الكل"}
              </span>
            </div>
            {selectedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                من أصل {totalPending} مستند معلق
              </span>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    قبول المحدد ({selectedCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد قبول المستندات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من قبول {selectedCount} مستند محدد؟ سيتم إرسال
                      إشعار للعميل.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={onApproveAll}>
                      تأكيد القبول
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    رفض المحدد ({selectedCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>رفض المستندات المحددة</AlertDialogTitle>
                    <AlertDialogDescription>
                      يرجى إدخال سبب الرفض. سيتم إرسال هذا السبب للعميل.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="اكتب سبب الرفض هنا..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRejectAll}
                      disabled={!rejectionReason.trim()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      تأكيد الرفض
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
