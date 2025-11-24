import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  branchId: string;
  onBranchIdChange: (value: string) => void;
  branches: any[];
}

export const PaymentFilters = ({
  searchQuery,
  onSearchChange,
  paymentMethod,
  onPaymentMethodChange,
  branchId,
  onBranchIdChange,
  branches
}: PaymentFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث برقم الحجز أو اسم العميل..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-10"
        />
      </div>
      
      <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="طريقة الدفع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الطرق</SelectItem>
          <SelectItem value="cash">نقدي</SelectItem>
          <SelectItem value="card">بطاقة</SelectItem>
          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
          <SelectItem value="online">دفع إلكتروني</SelectItem>
        </SelectContent>
      </Select>

      <Select value={branchId} onValueChange={onBranchIdChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="الفرع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الفروع</SelectItem>
          {branches?.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name_ar}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
