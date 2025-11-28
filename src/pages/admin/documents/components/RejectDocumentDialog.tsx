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
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface RejectDocumentDialogProps {
  documentId: string;
  onSuccess?: () => void;
}

export const RejectDocumentDialog = ({ documentId, onSuccess }: RejectDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reject_document', {
        p_document_id: documentId,
        p_reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم رفض المستند');
      setOpen(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['document-details', documentId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['admin-documents'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['customer-documents'], refetchType: 'all' });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل رفض المستند');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="flex-1">
          <X className="h-4 w-4" />
          رفض المستند
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفض المستند</DialogTitle>
          <DialogDescription>
            سيتم إرسال إشعار للعميل برفض المستند مع السبب
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الرفض</Label>
            <Textarea
              id="reason"
              placeholder="اكتب سبب رفض المستند..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setReason('');
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={() => rejectMutation.mutate()}
            disabled={!reason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
