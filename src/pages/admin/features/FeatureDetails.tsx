import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, ArrowRight } from "lucide-react";

type Feature = {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  created_at: string;
};

export default function FeatureDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeature();
  }, [id]);

  const fetchFeature = async () => {
    try {
      const { data, error } = await supabase
        .from("car_features")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFeature(data);
    } catch (error: any) {
      toast.error(error.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  if (!feature) {
    return (
      <div className="p-8">
        <p>الميزة غير موجودة</p>
        <Button onClick={() => navigate("/admin/features")} className="mt-4">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={feature.name_ar}
          description="تفاصيل الميزة"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/features/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 ml-2" />
            تعديل
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/features")}
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">الاسم بالعربية</h3>
            <p className="text-lg">{feature.name_ar}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">الاسم بالإنجليزية</h3>
            <p className="text-lg">{feature.name_en}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">الحالة</h3>
            <Badge variant={feature.is_active ? "default" : "secondary"}>
              {feature.is_active ? "نشط" : "غير نشط"}
            </Badge>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">تاريخ الإضافة</h3>
            <p className="text-lg">
              {new Date(feature.created_at).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}