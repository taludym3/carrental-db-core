import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, FileText, Car, Building2, DollarSign, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PaymentStatusBadge } from "./components/PaymentStatusBadge";
import { PaymentMethodBadge } from "./components/PaymentMethodBadge";
import { RefundDialog } from "./components/RefundDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["payment-details", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_payment_details', {
        p_payment_id: id
      });
      if (error) throw error;
      return data?.[0];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="تفاصيل الدفعة" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <PageHeader title="تفاصيل الدفعة" />
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">لم يتم العثور على الدفعة</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/payments")}>
            العودة للقائمة
          </Button>
        </Card>
      </div>
    );
  }

  const canRefund = ['completed', 'partial_refund'].includes(payment.payment_status) && 
                    payment.refund_amount < payment.amount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/payments")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <PageHeader
          title="تفاصيل الدفعة"
          description={`رقم الدفعة: ${payment.payment_id.substring(0, 8)}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">معلومات الدفعة</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الحالة:</span>
              <PaymentStatusBadge status={payment.payment_status} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المبلغ:</span>
              <span className="font-bold text-lg">{payment.amount.toLocaleString()} ريال</span>
            </div>
            {payment.refund_amount > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المبلغ المسترجع:</span>
                  <span className="font-medium text-red-600">
                    {payment.refund_amount.toLocaleString()} ريال
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المبلغ الصافي:</span>
                  <span className="font-bold">
                    {(payment.amount - payment.refund_amount).toLocaleString()} ريال
                  </span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">طريقة الدفع:</span>
              <PaymentMethodBadge method={payment.payment_method} />
            </div>
            {payment.transaction_reference && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">رقم المعاملة:</span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {payment.transaction_reference}
                  </code>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">تاريخ الدفع:</span>
              <span>
                {payment.payment_date
                  ? format(new Date(payment.payment_date), "d MMMM yyyy - h:mm a", { locale: ar })
                  : "غير محدد"}
              </span>
            </div>
            {payment.created_by_name && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تم الإنشاء بواسطة:</span>
                  <div className="text-left">
                    <p className="font-medium">{payment.created_by_name}</p>
                    <Badge variant="outline" className="text-xs">{payment.created_by_role}</Badge>
                  </div>
                </div>
              </>
            )}
          </div>

          {canRefund && (
            <div className="mt-6">
              <RefundDialog
                paymentId={payment.payment_id}
                currentAmount={payment.amount}
                refundedAmount={payment.refund_amount}
              />
            </div>
          )}
        </Card>

        {/* Booking Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">معلومات الحجز</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">رقم الحجز:</span>
              <Link to={`/admin/bookings/${payment.booking_id}`}>
                <Button variant="link" className="p-0 h-auto font-mono">
                  {payment.booking_id.substring(0, 8)}
                </Button>
              </Link>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">حالة الحجز:</span>
              <Badge>{payment.booking_status}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الفترة:</span>
              <span className="text-sm">
                {format(new Date(payment.booking_start_date), "d MMM", { locale: ar })} - 
                {format(new Date(payment.booking_end_date), "d MMM yyyy", { locale: ar })}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">إجمالي الحجز:</span>
              <span className="font-medium">{payment.booking_total_amount.toLocaleString()} ريال</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المبلغ النهائي:</span>
              <span className="font-medium">{payment.booking_final_amount.toLocaleString()} ريال</span>
            </div>
            <Separator />
            <div className="space-y-2 bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">إجمالي المدفوع:</span>
                <span className="font-bold text-green-600">
                  {payment.total_paid.toLocaleString()} ريال
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">المتبقي:</span>
                <span className="font-bold text-orange-600">
                  {payment.remaining_amount.toLocaleString()} ريال
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">معلومات العميل</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">الاسم</p>
              <p className="font-medium">{payment.customer_name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
              <p className="font-medium">{payment.customer_email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">رقم الجوال</p>
              <p className="font-medium" dir="ltr">{payment.customer_phone}</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">الحساب موثق:</span>
              <Badge variant={payment.customer_verified ? "default" : "secondary"}>
                {payment.customer_verified ? "نعم" : "لا"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Car & Branch Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">معلومات السيارة والفرع</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">السيارة</p>
              <p className="font-medium">
                {payment.car_brand_ar} {payment.car_model_ar}
              </p>
              {payment.car_color_ar && (
                <p className="text-sm text-muted-foreground">اللون: {payment.car_color_ar}</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">الفرع</p>
              </div>
              <p className="font-medium">{payment.branch_name_ar}</p>
              {payment.branch_phone && (
                <p className="text-sm text-muted-foreground" dir="ltr">{payment.branch_phone}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Notes & Refund Reason */}
      {(payment.notes || payment.refund_reason) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">ملاحظات إضافية</h3>
          </div>
          <div className="space-y-4">
            {payment.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">ملاحظات الدفعة:</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{payment.notes}</p>
              </div>
            )}
            {payment.refund_reason && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">سبب الاسترجاع:</p>
                <p className="text-sm bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {payment.refund_reason}
                </p>
                {payment.refund_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 inline ml-1" />
                    تاريخ الاسترجاع: {format(new Date(payment.refund_date), "d MMMM yyyy - h:mm a", { locale: ar })}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
