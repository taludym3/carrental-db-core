import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Plus, Search } from "lucide-react";

type Feature = {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  created_at: string;
};

export default function FeaturesList() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [filteredFeatures, setFilteredFeatures] = useState<Feature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeatures();
  }, []);

  useEffect(() => {
    filterFeatures();
  }, [searchQuery, features]);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("car_features")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      toast.error(error.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const filterFeatures = () => {
    let filtered = features;

    if (searchQuery) {
      filtered = filtered.filter((feature) =>
        feature.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.name_en.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFeatures(filtered);
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;

    try {
      const { error } = await supabase
        .from("car_features")
        .delete()
        .eq("id", selectedFeature.id);

      if (error) throw error;

      toast.success("تم حذف الميزة بنجاح");
      fetchFeatures();
    } catch (error: any) {
      toast.error(error.message || "خطأ في الحذف");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFeature(null);
    }
  };

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المميزات"
        description="إدارة مميزات السيارات"
      />

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن ميزة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button onClick={() => navigate("/admin/features/add")}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة ميزة
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم بالعربية</TableHead>
              <TableHead>الاسم بالإنجليزية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإضافة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  لا توجد مميزات
                </TableCell>
              </TableRow>
            ) : (
              filteredFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">{feature.name_ar}</TableCell>
                  <TableCell>{feature.name_en}</TableCell>
                  <TableCell>
                    <Badge variant={feature.is_active ? "default" : "secondary"}>
                      {feature.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(feature.created_at).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/features/${feature.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/features/${feature.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFeature(feature);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الميزة "{selectedFeature?.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}