import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/PageHeader";

const formSchema = z.object({
  name_en: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
  name_ar: z.string().min(1, "الاسم بالعربية مطلوب"),
  is_active: z.boolean().default(true),
});

export default function FeaturesAdd() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_en: "",
      name_ar: "",
      is_active: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from("car_features")
        .insert({
          name_en: values.name_en,
          name_ar: values.name_ar,
          is_active: values.is_active,
        });

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة الميزة بنجاح",
      });

      navigate("/admin/features");
    } catch (error: any) {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إضافة ميزة جديدة"
        description="أضف ميزة جديدة لقائمة مميزات السيارات"
      />

      <div className="bg-card p-6 rounded-lg border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربية *</FormLabel>
                    <FormControl>
                      <Input placeholder="نظام ملاحة GPS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية *</FormLabel>
                    <FormControl>
                      <Input placeholder="GPS Navigation System" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel>حالة التفعيل</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      تفعيل أو إلغاء تفعيل الميزة
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/features")}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
