import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DocumentStatus = Database['public']['Enums']['document_status'];

interface ChangeDocumentStatusDialogProps {
  documentId: string;
  currentStatus: DocumentStatus;
  onSuccess?: () => void;
}

export const ChangeDocumentStatusDialog = ({ 
  documentId, 
  currentStatus,
  onSuccess: onSuccessCallback
}: ChangeDocumentStatusDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DocumentStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const changeStatusMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('update_document_status', {
        p_document_id: documentId,
        p_new_status: newStatus,
        p_reason: newStatus === 'rejected' ? reason : null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة المستند بنجاح');
      setOpen(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['document-details', documentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      onSuccessCallback?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل تحديث حالة المستند');
    }
  });

  const getStatusLabel = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="flex-1">
          <RefreshCw className="h-4 w-4" />
          تغيير الحالة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير حالة المستند</DialogTitle>
          <DialogDescription>
            يمكنك تغيير حالة المستند إلى أي حالة أخرى
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">الحالة الجديدة</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as DocumentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newStatus === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الرفض</Label>
              <Textarea
                id="reason"
                placeholder="اكتب سبب رفض المستند..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setNewStatus(currentStatus);
              setReason('');
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => changeStatusMutation.mutate()}
            disabled={
              (newStatus === 'rejected' && !reason.trim()) || 
              changeStatusMutation.isPending ||
              newStatus === currentStatus
            }
          >
            {changeStatusMutation.isPending ? 'جاري التحديث...' : 'تأكيد التغيير'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
