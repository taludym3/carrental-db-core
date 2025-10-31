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

interface RejectBookingDialogProps {
  bookingId: string;
}

export const RejectBookingDialog = ({ bookingId }: RejectBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('reject_booking', {
        p_booking_id: bookingId,
        p_reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم رفض الحجز');
      setOpen(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل رفض الحجز');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg" className="flex-1">
          <X className="h-4 w-4" />
          رفض الحجز
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفض الحجز</DialogTitle>
          <DialogDescription>
            سيتم إرسال إشعار للعميل برفض الحجز مع السبب
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الرفض</Label>
            <Textarea
              id="reason"
              placeholder="اكتب سبب رفض الحجز..."
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
