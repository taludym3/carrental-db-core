import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Car, Building2, Calendar } from 'lucide-react';
import { BookingStatusBadge } from '@/pages/admin/bookings/components/BookingStatusBadge';
import { ApproveBookingDialog } from '@/pages/admin/bookings/components/ApproveBookingDialog';
import { RejectBookingDialog } from '@/pages/admin/bookings/components/RejectBookingDialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';

const BranchBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['branch-booking-details', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_booking_details', {
        p_booking_id: id
      });
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Booking not found');
      
      setNotes(data[0].notes || '');
      return data[0];
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { data, error } = await supabase.rpc('update_booking_notes', {
        p_booking_id: id,
        p_notes: newNotes
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم تحديث الملاحظات بنجاح');
      setIsEditingNotes(false);
      queryClient.invalidateQueries({ queryKey: ['branch-booking-details', id] });
    },
    onError: () => {
      toast.error('فشل تحديث الملاحظات');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لم يتم العثور على الحجز</p>
      </div>
    );
  }

  const canApprove = booking.booking_status === 'pending';
  const canReject = booking.booking_status === 'pending';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`تفاصيل الحجز #${booking.booking_id.slice(0, 8)}`}
        action={
          <Button variant="ghost" onClick={() => navigate('/branch/bookings')}>
            <ArrowLeft className="h-4 w-4" />
            العودة للقائمة
          </Button>
        }
      />

      {/* معلومات أساسية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات أساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">رقم الحجز</p>
              <p className="font-mono text-sm">{booking.booking_id}</p>
            </div>
            <BookingStatusBadge status={booking.booking_status} />
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="text-sm font-medium">
                {format(new Date(booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: ar })}
              </p>
            </div>
            {booking.approved_at && (
              <div>
                <p className="text-sm text-muted-foreground">تاريخ القبول</p>
                <p className="text-sm font-medium">
                  {format(new Date(booking.approved_at), 'dd MMMM yyyy, HH:mm', { locale: ar })}
                </p>
                {booking.approved_by_name && (
                  <p className="text-xs text-muted-foreground">من قبل: {booking.approved_by_name}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* معلومات العميل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">الاسم الكامل</p>
              <p className="font-medium">{booking.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="text-sm">{booking.customer_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="text-sm">{booking.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حالة التحقق</p>
              <Badge variant={booking.customer_verified ? 'default' : 'secondary'}>
                {booking.customer_verified ? 'موثق' : 'غير موثق'}
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">الحجوزات السابقة</p>
                <p className="text-2xl font-bold">{booking.customer_bookings_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المستندات المقبولة</p>
                <p className="text-2xl font-bold">
                  {booking.customer_approved_documents_count}/{booking.customer_documents_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل السيارة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              تفاصيل السيارة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.car_image_url && (
              <img 
                src={booking.car_image_url} 
                alt="Car" 
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div>
              <p className="text-sm text-muted-foreground">العلامة والموديل</p>
              <p className="font-medium text-lg">
                {booking.brand_name_ar} {booking.model_name_ar}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">السنة</p>
                <p className="font-medium">{booking.model_year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اللون</p>
                <p className="font-medium">{booking.color_name_ar}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الإيجار</p>
              <Badge>{booking.rental_type}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل الحجز */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تفاصيل الحجز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                <p className="font-medium">
                  {format(new Date(booking.start_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                <p className="font-medium">
                  {format(new Date(booking.end_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عدد الأيام</p>
                <p className="text-2xl font-bold">{booking.total_days} يوم</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">السعر اليومي</span>
                <span className="font-medium">{booking.daily_rate?.toLocaleString('ar-SA')} ريال</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ الإجمالي</span>
                <span className="font-medium">{booking.total_amount?.toLocaleString('ar-SA')} ريال</span>
              </div>
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم</span>
                  <span>-{booking.discount_amount?.toLocaleString('ar-SA')} ريال</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>المبلغ النهائي</span>
                <span className="text-primary">{booking.final_amount?.toLocaleString('ar-SA')} ريال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الفرع */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات الفرع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">اسم الفرع</p>
              <p className="font-medium text-lg">{booking.branch_name_ar}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الموقع</p>
              <p className="text-sm">{booking.branch_location_ar}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم الهاتف</p>
              <p className="text-sm">{booking.branch_phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الملاحظات */}
      <Card>
        <CardHeader>
          <CardTitle>الملاحظات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingNotes ? (
            <>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => updateNotesMutation.mutate(notes)}
                  disabled={updateNotesMutation.isPending}
                >
                  حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotes(booking.notes || '');
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {booking.notes || 'لا توجد ملاحظات'}
              </p>
              <Button variant="outline" onClick={() => setIsEditingNotes(true)}>
                تعديل الملاحظات
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* الإجراءات */}
      {(canApprove || canReject) && (
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {canApprove && <ApproveBookingDialog bookingId={booking.booking_id} />}
              {canReject && <RejectBookingDialog bookingId={booking.booking_id} />}
            </div>
          </CardContent>
        </Card>
      )}

      {booking.booking_status === 'confirmed' && booking.expires_at && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertTitle>في انتظار الدفع</AlertTitle>
          <AlertDescription>
            تنتهي صلاحية الحجز في: {format(new Date(booking.expires_at), 'dd MMMM yyyy, HH:mm', { locale: ar })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BranchBookingDetails;
