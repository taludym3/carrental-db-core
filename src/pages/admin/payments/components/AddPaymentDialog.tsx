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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddPaymentDialogProps {
  bookingId: string;
}

export const AddPaymentDialog = ({ bookingId }: AddPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('add_manual_payment', {
        p_booking_id: bookingId,
        p_amount: parseFloat(amount),
        p_payment_method: paymentMethod,
        p_transaction_reference: transactionReference || null,
        p_notes: notes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم إضافة الدفعة بنجاح");
      setOpen(false);
      setAmount("");
      setPaymentMethod("cash");
      setTransactionReference("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["booking-payments", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة الدفعة");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    addPaymentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إضافة دفعة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة دفعة يدوية</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ (ريال) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">طريقة الدفع *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="card">بطاقة</SelectItem>
                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                <SelectItem value="online">دفع إلكتروني</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">رقم المعاملة (اختياري)</Label>
            <Input
              id="reference"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="TX123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addPaymentMutation.isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending ? "جاري الإضافة..." : "إضافة الدفعة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
