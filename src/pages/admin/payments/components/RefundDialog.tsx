import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RefundDialogProps {
  paymentId: string;
  currentAmount: number;
  refundedAmount: number;
}

export const RefundDialog = ({ paymentId, currentAmount, refundedAmount }: RefundDialogProps) => {
  const [open, setOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const queryClient = useQueryClient();

  const maxRefundAmount = currentAmount - refundedAmount;

  const refundMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('process_refund', {
        p_payment_id: paymentId,
        p_refund_amount: parseFloat(refundAmount),
        p_refund_reason: refundReason
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم استرجاع المبلغ بنجاح");
      setOpen(false);
      setRefundAmount("");
      setRefundReason("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-details", paymentId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء استرجاع المبلغ");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(refundAmount);
    
    if (!amount || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (amount > maxRefundAmount) {
      toast.error(`المبلغ المسترجع لا يمكن أن يتجاوز ${maxRefundAmount} ريال`);
      return;
    }

    if (!refundReason.trim()) {
      toast.error("يرجى إدخال سبب الاسترجاع");
      return;
    }

    refundMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCcw className="h-4 w-4 ml-2" />
          استرجاع
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>استرجاع مبلغ الدفعة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertDescription>
              المبلغ المتاح للاسترجاع: <strong>{maxRefundAmount.toLocaleString()} ريال</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="refundAmount">مبلغ الاسترجاع (ريال) *</Label>
            <Input
              id="refundAmount"
              type="number"
              step="0.01"
              min="0"
              max={maxRefundAmount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: {maxRefundAmount.toLocaleString()} ريال
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">سبب الاسترجاع *</Label>
            <Textarea
              id="reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="يرجى توضيح سبب استرجاع المبلغ..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={refundMutation.isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={refundMutation.isPending}>
              {refundMutation.isPending ? "جاري الاسترجاع..." : "تأكيد الاسترجاع"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
