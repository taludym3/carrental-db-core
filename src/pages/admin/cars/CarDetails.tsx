import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const statusColors = {
  available: "bg-green-500/10 text-green-500 border-green-500/20",
  rented: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  maintenance: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hidden: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels = {
  available: "متاحة",
  rented: "مؤجرة",
  maintenance: "صيانة",
  hidden: "مخفية",
};

export default function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);

  useEffect(() => {
    fetchCar();
    fetchBookingsStats();
  }, [id]);

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          branches(id),
          car_models(name_en, name_ar, default_image_url, car_brands(name_en, name_ar, logo_url)),
          car_colors(name_en, name_ar, hex_code)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setCar(data);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsStats = async () => {
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", id);

    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", id)
      .in("status", ["pending", "confirmed", "active"]);

    setBookingsCount(allBookings?.length || 0);
    setActiveBookingsCount(activeBookings?.length || 0);
  };

  const handleDelete = async () => {
    if (activeBookingsCount > 0) {
      toast({
        title: "لا يمكن الحذف",
        description: `هذه السيارة لديها ${activeBookingsCount} حجز نشط`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      if (car.branch_images?.length > 0) {
        await supabase.storage.from("car-images").remove(car.branch_images);
      }

      const { error } = await supabase.from("cars").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف السيارة بنجاح",
      });

      navigate("/admin/cars");
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from("car-images").getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  if (!car) {
    return <div className="p-8">السيارة غير موجودة</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تفاصيل السيارة"
        description={`${car.car_models?.car_brands?.name_ar || car.car_models?.car_brands?.name_en || ""} ${car.car_models?.name_ar || car.car_models?.name_en || ""}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/cars")}>
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Button>
            <Button variant="outline" onClick={() => navigate(`/admin/cars/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              تعديل
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>الصور</CardTitle>
            </CardHeader>
            <CardContent>
              {car.branch_images?.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {car.branch_images.map((image: string, index: number) => (
                      <CarouselItem key={index}>
                        <img
                          src={getImageUrl(image)}
                          alt={`صورة ${index + 1}`}
                          className="w-full h-96 object-cover rounded-lg"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <img
                  src={car.car_models?.default_image_url || "/placeholder.svg"}
                  alt={car.car_models?.name_en || ""}
                  className="w-full h-96 object-cover rounded-lg"
                />
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">البراند</p>
                  <div className="flex items-center gap-2 mt-1">
                    {car.car_models?.car_brands?.logo_url && (
                      <img src={car.car_models.car_brands.logo_url} alt="" className="h-6 w-6 object-contain" />
                    )}
                    <p className="font-medium">{car.car_models?.car_brands?.name_ar || car.car_models?.car_brands?.name_en}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الموديل</p>
                  <p className="font-medium">{car.car_models?.name_ar || car.car_models?.name_en}</p>
                </div>
                {car.car_colors && (
                  <div>
                    <p className="text-sm text-muted-foreground">اللون</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: car.car_colors.hex_code || "#000" }}
                      />
                      <p className="font-medium">{car.car_colors.name_ar || car.car_colors.name_en}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">الفرع</p>
                  <p className="font-medium">-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <Badge className={statusColors[car.status as keyof typeof statusColors]}>
                    {statusLabels[car.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">سيارة جديدة</p>
                  <p className="font-medium">{car.is_new ? "نعم" : "لا"}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">عدد المقاعد</p>
                  <p className="font-medium">{car.seats}</p>
                </div>
                {car.mileage && (
                  <div>
                    <p className="text-sm text-muted-foreground">الكيلومترات</p>
                    <p className="font-medium">{car.mileage.toLocaleString()} كم</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">نوع الوقود</p>
                  <p className="font-medium">
                    {car.fuel_type === "gasoline" && "بنزين"}
                    {car.fuel_type === "diesel" && "ديزل"}
                    {car.fuel_type === "electric" && "كهربائي"}
                    {car.fuel_type === "hybrid" && "هجين"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ناقل الحركة</p>
                  <p className="font-medium">
                    {car.transmission === "automatic" ? "أوتوماتيك" : "يدوي"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          {(car.features_en?.length > 0 || car.features_ar?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>المميزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.features_en?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">مميزات (English)</p>
                    <div className="flex flex-wrap gap-2">
                      {car.features_en.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {car.features_ar?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">مميزات (عربي)</p>
                    <div className="flex flex-wrap gap-2">
                      {car.features_ar.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Descriptions */}
          {(car.branch_description_en || car.branch_description_ar) && (
            <Card>
              <CardHeader>
                <CardTitle>وصف الفرع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.branch_description_en && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">English</p>
                    <p className="text-sm">{car.branch_description_en}</p>
                  </div>
                )}
                {car.branch_description_ar && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">عربي</p>
                    <p className="text-sm">{car.branch_description_ar}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quantities */}
          <Card>
            <CardHeader>
              <CardTitle>الكميات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">الكمية الإجمالية</p>
                <p className="text-2xl font-bold">{car.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الكمية المتاحة</p>
                <p className="text-2xl font-bold text-green-500">{car.available_quantity}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>نسبة التوفر</span>
                  <span className="font-medium">
                    {Math.round((car.available_quantity / car.quantity) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(car.available_quantity / car.quantity) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prices */}
          <Card>
            <CardHeader>
              <CardTitle>الأسعار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {car.rental_types.includes("daily") && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">📅 يومي</span>
                  <span className="font-bold">{car.daily_price} ر.س</span>
                </div>
              )}
              {car.rental_types.includes("weekly") && car.weekly_price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">📆 أسبوعي</span>
                  <span className="font-bold">{car.weekly_price} ر.س</span>
                </div>
              )}
              {car.rental_types.includes("monthly") && car.monthly_price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">🗓️ شهري</span>
                  <span className="font-bold">{car.monthly_price} ر.س</span>
                </div>
              )}
              {car.rental_types.includes("ownership") && car.ownership_price && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">🏆 ملكية</span>
                  <span className="font-bold">{car.ownership_price} ر.س</span>
                </div>
              )}

              {car.discount_percentage > 0 && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-sm font-medium text-destructive">عرض خاص</p>
                    <p className="text-2xl font-bold text-destructive">{car.discount_percentage}%</p>
                    {car.offer_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ينتهي: {new Date(car.offer_expires_at).toLocaleDateString("ar")}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bookings Stats */}
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الحجوزات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي الحجوزات</span>
                <span className="font-bold">{bookingsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الحجوزات النشطة</span>
                <Badge variant={activeBookingsCount > 0 ? "default" : "secondary"}>
                  {activeBookingsCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {activeBookingsCount > 0 ? (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">
                    هذه السيارة لديها {activeBookingsCount} حجز نشط!
                  </p>
                  <p>لا يمكن حذف السيارة.</p>
                </div>
              ) : (
                <p>هل أنت متأكد من حذف هذه السيارة؟</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {activeBookingsCount === 0 && (
              <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
