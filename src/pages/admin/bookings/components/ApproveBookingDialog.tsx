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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApproveBookingDialogProps {
  bookingId: string;
}

export const ApproveBookingDialog = ({ bookingId }: ApproveBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(24);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('approve_booking', {
        p_booking_id: bookingId,
        p_payment_deadline_hours: hours
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم قبول الحجز بنجاح');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل قبول الحجز');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1">
          <Check className="h-4 w-4" />
          قبول الحجز
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>قبول الحجز</DialogTitle>
          <DialogDescription>
            سيتم إرسال إشعار للعميل بقبول الحجز وطلب الدفع
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">مدة صلاحية الدفع (بالساعات)</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              بعد انتهاء هذه المدة، سيتم إلغاء الحجز تلقائياً إذا لم يتم الدفع
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? 'جاري القبول...' : 'تأكيد القبول'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
