import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { FeaturesMultiSelect } from "@/components/admin/FeaturesMultiSelect";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  model_id: z.string().min(1, "الموديل مطلوب"),
  color_id: z.string().optional().nullable(),
  status: z.enum(["available", "rented", "maintenance", "hidden"]),
  rental_types: z.array(z.string()).min(1, "اختر نوع تأجير واحد على الأقل"),
  seats: z.coerce.number().min(1).default(5),
  mileage: z.coerce.number().optional().nullable(),
  fuel_type: z.enum(["gasoline", "diesel", "electric", "hybrid"]),
  transmission: z.enum(["automatic", "manual"]),
  is_new: z.boolean().default(false),
  quantity: z.coerce.number().min(1, "الكمية مطلوبة"),
  daily_price: z.coerce.number().min(0, "السعر اليومي مطلوب"),
  weekly_price: z.coerce.number().optional().nullable(),
  monthly_price: z.coerce.number().optional().nullable(),
  ownership_price: z.coerce.number().optional().nullable(),
  discount_percentage: z.coerce.number().min(0).max(100).default(0),
  offer_expires_at: z.string().optional().nullable(),
  feature_ids: z.array(z.string().uuid()).default([]),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  additional_images: z.array(z.string()).default([]),
});

export default function BranchCarEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const rentalTypes = form.watch("rental_types");

  useEffect(() => {
    fetchModels();
    fetchColors();
    fetchCar();
  }, [id]);

  const fetchModels = async () => {
    const { data } = await supabase
      .from("car_models")
      .select("*, car_brands(name_en, name_ar)")
      .order("name_en");
    setModels(data || []);
  };

  const fetchColors = async () => {
    const { data } = await supabase.from("car_colors").select("*").order("name_en");
    setColors(data || []);
  };

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { data: features } = await supabase.rpc('get_car_features', {
        p_car_id: id,
      });

      form.reset({
        model_id: data.model_id,
        color_id: data.color_id || undefined,
        status: data.status as any,
        rental_types: data.rental_types as any,
        seats: data.seats,
        mileage: data.mileage || undefined,
        fuel_type: data.fuel_type as any,
        transmission: data.transmission as any,
        is_new: data.is_new,
        quantity: data.quantity,
        daily_price: data.daily_price,
        weekly_price: data.weekly_price || undefined,
        monthly_price: data.monthly_price || undefined,
        ownership_price: data.ownership_price || undefined,
        discount_percentage: data.discount_percentage,
        offer_expires_at: data.offer_expires_at || undefined,
        feature_ids: features?.map((f: any) => f.feature_id) || [],
        description_ar: data.description_ar || undefined,
        description_en: data.description_en || undefined,
        additional_images: data.additional_images || [],
      });
    } catch (error: any) {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setDataLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const { feature_ids, ...carData } = values;
      
      const { error } = await supabase
        .from("cars")
        .update(carData as any)
        .eq("id", id);

      if (error) throw error;

      const { error: featuresError } = await supabase.rpc('set_car_features', {
        p_car_id: id,
        p_feature_ids: feature_ids,
      });

      if (featuresError) throw featuresError;

      toast.success("تم تحديث بيانات السيارة بنجاح");
      await queryClient.invalidateQueries({ queryKey: ['branch-cars'] });
      navigate(`/branch/cars/${id}`);
    } catch (error: any) {
      toast.error(error.message || "خطأ في التحديث");
    } finally {
      setLoading(false);
    }
  };

  const toggleRentalType = (type: string) => {
    const current = form.getValues("rental_types");
    if (current.includes(type)) {
      form.setValue("rental_types", current.filter((t) => t !== type));
    } else {
      form.setValue("rental_types", [...current, type]);
    }
  };

  if (dataLoading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تعديل السيارة"
        description="تعديل بيانات السيارة"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموديل *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموديل" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.car_brands?.name_ar || model.car_brands?.name_en} {model.name_ar || model.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اللون</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر اللون" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colors.map((color) => (
                            <SelectItem key={color.id} value={color.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.hex_code || "#000" }}
                                />
                                {color.name_ar || color.name_en}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">متاحة</SelectItem>
                          <SelectItem value="rented">مؤجرة</SelectItem>
                          <SelectItem value="maintenance">صيانة</SelectItem>
                          <SelectItem value="hidden">مخفية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد المقاعد</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكيلومترات</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuel_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الوقود</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasoline">بنزين</SelectItem>
                          <SelectItem value="diesel">ديزل</SelectItem>
                          <SelectItem value="electric">كهربائي</SelectItem>
                          <SelectItem value="hybrid">هجين</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ناقل الحركة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="automatic">أوتوماتيك</SelectItem>
                          <SelectItem value="manual">يدوي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_new"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                      <FormLabel>سيارة جديدة؟</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">الكميات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية الإجمالية *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                💡 الكمية المتاحة سيتم حسابها تلقائياً بناءً على الحجوزات النشطة
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">الأسعار وأنواع التأجير</h3>
              <div className="space-y-4">
                <div>
                  <FormLabel>أنواع التأجير المتاحة *</FormLabel>
                  <div className="flex gap-4 mt-2">
                    {["daily", "weekly", "monthly", "ownership"].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={rentalTypes?.includes(type)}
                          onCheckedChange={() => toggleRentalType(type)}
                        />
                        <span>
                          {type === "daily" && "يومي"}
                          {type === "weekly" && "أسبوعي"}
                          {type === "monthly" && "شهري"}
                          {type === "ownership" && "ملكية"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="daily_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر اليومي (ر.س) *</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {rentalTypes?.includes("weekly") && (
                    <FormField
                      control={form.control}
                      name="weekly_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر الأسبوعي (ر.س)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {rentalTypes?.includes("monthly") && (
                    <FormField
                      control={form.control}
                      name="monthly_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر الشهري (ر.س)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {rentalTypes?.includes("ownership") && (
                    <FormField
                      control={form.control}
                      name="ownership_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سعر الملكية (ر.س)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">العروض (اختياري)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نسبة الخصم (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offer_expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ انتهاء العرض</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">المميزات</h3>
              <FormItem>
                <FormLabel>اختر المميزات</FormLabel>
                <FormControl>
                  <FeaturesMultiSelect
                    selectedFeatureIds={form.watch("feature_ids") || []}
                    onChange={(ids) => form.setValue("feature_ids", ids)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">وصف السيارة</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف بالإنجليزية</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف بالعربية</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">صور السيارة الإضافية</h3>
              <FormField
                control={form.control}
                name="additional_images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiImageUploader
                        currentImages={field.value}
                        onImagesChange={field.onChange}
                        bucket="car-images"
                        folder="cars"
                        maxImages={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "جاري التحديث..." : "تحديث السيارة"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/branch/cars/${id}`)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
