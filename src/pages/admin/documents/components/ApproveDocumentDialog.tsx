import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApproveDocumentDialogProps {
  documentId: string;
  onSuccess?: () => void;
}

export const ApproveDocumentDialog = ({ documentId, onSuccess }: ApproveDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('approve_document', {
        p_document_id: documentId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم قبول المستند');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document-details', documentId], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['admin-documents'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['customer-documents'], refetchType: 'all' });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل قبول المستند');
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="flex-1">
          <CheckCircle className="h-4 w-4" />
          قبول المستند
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>قبول المستند</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من قبول هذا المستند؟ سيتم إرسال إشعار للعميل بالقبول.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'جاري القبول...' : 'تأكيد القبول'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
