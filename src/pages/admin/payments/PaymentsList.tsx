import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PaymentStatusBadge } from "./components/PaymentStatusBadge";
import { PaymentMethodBadge } from "./components/PaymentMethodBadge";
import { PaymentStatsCards } from "./components/PaymentStatsCards";
import { PaymentFilters } from "./components/PaymentFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [branchId, setBranchId] = useState("all");

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name_ar")
        .eq("is_active", true)
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["payment-stats", branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_payment_stats', {
        p_branch_id: branchId === "all" ? null : branchId
      });
      if (error) throw error;
      return data?.[0];
    },
  });

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments", statusFilter, paymentMethod, branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_payments_list', {
        p_status: statusFilter === "all" ? null : statusFilter,
        p_payment_method: paymentMethod === "all" ? null : paymentMethod,
        p_branch_id: branchId === "all" ? null : branchId,
        p_limit: 100,
        p_offset: 0
      });
      if (error) throw error;
      return data;
    },
  });

  const filteredPayments = paymentsData?.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.booking_reference?.toLowerCase().includes(searchLower) ||
      payment.customer_name?.toLowerCase().includes(searchLower) ||
      payment.customer_email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المدفوعات"
        description="عرض وإدارة جميع المدفوعات والعمليات المالية"
      />

      <PaymentStatsCards stats={stats} isLoading={statsLoading} />

      <Card className="p-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="completed">مكتملة</TabsTrigger>
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="failed">فاشلة</TabsTrigger>
              <TabsTrigger value="refunded">مسترجعة</TabsTrigger>
            </TabsList>
          </div>

          <PaymentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            branchId={branchId}
            onBranchIdChange={setBranchId}
            branches={branches || []}
          />

          <TabsContent value={statusFilter} className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredPayments && filteredPayments.length > 0 ? (
              <>
                {/* Mobile View - Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredPayments.map((payment) => (
                    <Card key={payment.payment_id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{payment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.booking_reference}
                            </p>
                          </div>
                          <PaymentStatusBadge status={payment.payment_status} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">المبلغ</p>
                            <p className="font-medium">{payment.amount.toLocaleString()} ريال</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">طريقة الدفع</p>
                            <PaymentMethodBadge method={payment.payment_method} />
                          </div>
                          <div>
                            <p className="text-muted-foreground">التاريخ</p>
                            <p className="font-medium">
                              {payment.payment_date
                                ? format(new Date(payment.payment_date), "d MMM yyyy", { locale: ar })
                                : "غير محدد"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">الفرع</p>
                            <p className="font-medium">{payment.branch_name_ar}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/admin/payments/${payment.payment_id}`)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض التفاصيل
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الدفعة</TableHead>
                        <TableHead>رقم الحجز</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الفرع</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.payment_id}>
                          <TableCell className="font-mono text-sm">
                            {payment.payment_id.substring(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono"
                              onClick={() => navigate(`/admin/bookings/${payment.booking_id}`)}
                            >
                              {payment.booking_reference}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.amount.toLocaleString()} ريال
                          </TableCell>
                          <TableCell>
                            <PaymentMethodBadge method={payment.payment_method} />
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={payment.payment_status} />
                          </TableCell>
                          <TableCell>
                            {payment.payment_date
                              ? format(new Date(payment.payment_date), "d MMM yyyy", { locale: ar })
                              : "غير محدد"}
                          </TableCell>
                          <TableCell>{payment.branch_name_ar}</TableCell>
                          <TableCell className="text-left">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/payments/${payment.payment_id}`)}
                            >
                              <Eye className="h-4 w-4 ml-2" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">لا توجد مدفوعات</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
