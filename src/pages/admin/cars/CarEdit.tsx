import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { FeaturesInput } from "@/components/admin/FeaturesInput";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  branch_id: z.string().min(1, "الفرع مطلوب"),
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
  available_quantity: z.coerce.number().min(0),
  daily_price: z.coerce.number().min(0, "السعر اليومي مطلوب"),
  weekly_price: z.coerce.number().optional().nullable(),
  monthly_price: z.coerce.number().optional().nullable(),
  ownership_price: z.coerce.number().optional().nullable(),
  discount_percentage: z.coerce.number().min(0).max(100).default(0),
  offer_expires_at: z.string().optional().nullable(),
  features: z.array(z.string()).default([]),
  features_en: z.array(z.string()).default([]),
  features_ar: z.array(z.string()).default([]),
  branch_description_en: z.string().optional().nullable(),
  branch_description_ar: z.string().optional().nullable(),
  branch_images: z.array(z.string()).default([]),
});

export default function CarEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const rentalTypes = form.watch("rental_types");

  useEffect(() => {
    fetchBranches();
    fetchModels();
    fetchColors();
    fetchCar();
  }, [id]);

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("name");
    setBranches(data || []);
  };

  const fetchModels = async () => {
    const { data } = await supabase
      .from("models")
      .select("*, brands(name, name_en)")
      .order("name");
    setModels(data || []);
  };

  const fetchColors = async () => {
    const { data } = await supabase.from("colors").select("*").order("name");
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

      form.reset({
        ...data,
        color_id: data.color_id || undefined,
        mileage: data.mileage || undefined,
        weekly_price: data.weekly_price || undefined,
        monthly_price: data.monthly_price || undefined,
        ownership_price: data.ownership_price || undefined,
        offer_expires_at: data.offer_expires_at || undefined,
        branch_description_en: data.branch_description_en || undefined,
        branch_description_ar: data.branch_description_ar || undefined,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("cars")
        .update(values)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات السيارة بنجاح",
      });

      navigate(`/admin/cars/${id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
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
            {/* Same form fields as CarsAdd.tsx */}
            <div>
              <h3 className="text-lg font-semibold mb-4">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفرع *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفرع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
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
                              {model.brands?.name} {model.name}
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
                                  style={{ backgroundColor: color.hex_code }}
                                />
                                {color.name}
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

                <FormField
                  control={form.control}
                  name="available_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكمية المتاحة *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مميزات عامة</FormLabel>
                      <FormControl>
                        <FeaturesInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="أضف ميزة..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مميزات بالإنجليزية</FormLabel>
                      <FormControl>
                        <FeaturesInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add feature..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مميزات بالعربية</FormLabel>
                      <FormControl>
                        <FeaturesInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="أضف ميزة..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">وصف الفرع</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="branch_description_en"
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
                  name="branch_description_ar"
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
              <h3 className="text-lg font-semibold mb-4">صور الفرع</h3>
              <FormField
                control={form.control}
                name="branch_images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiImageUploader
                        currentImages={field.value}
                        onImagesChange={field.onChange}
                        bucket="car-images"
                        folder={`cars/${id}`}
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
            <Button type="button" variant="outline" onClick={() => navigate(`/admin/cars/${id}`)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
