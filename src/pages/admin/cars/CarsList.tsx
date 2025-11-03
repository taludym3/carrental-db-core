import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Car = {
  id: string;
  branch_id: string;
  model_id: string | null;
  color_id: string | null;
  status: string;
  rental_types: string[];
  seats: number;
  quantity: number;
  actual_available_quantity: number;
  available_quantity: number;
  daily_price: number;
  weekly_price: number | null;
  monthly_price: number | null;
  ownership_price: number | null;
  additional_images: string[] | null;
  branch_name_en: string | null;
  branch_name_ar: string | null;
  model_name_en: string | null;
  model_name_ar: string | null;
  brand_name_en: string | null;
  brand_name_ar: string | null;
  color_name_en: string | null;
  color_name_ar: string | null;
  color_hex_code: string | null;
  default_image_url: string | null;
  created_at?: string;
  updated_at?: string;
  is_new?: boolean;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  discount_percentage?: number;
  offer_expires_at?: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  feature_ids?: string[] | null;
};

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

export default function CarsList() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRentalTypes, setSelectedRentalTypes] = useState<string[]>([]);

  const [branches, setBranches] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCars();
    fetchBranches();
    fetchBrands();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cars, searchTerm, selectedBranch, selectedBrand, selectedStatus, selectedRentalTypes]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from("cars_with_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCars((data || []) as any[]);
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

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("id, name, name_en").order("name");
    setBranches(data || []);
  };

  const fetchBrands = async () => {
    const { data } = await supabase.from("car_brands").select("id, name_en, name_ar").order("name_en");
    setBrands(data || []);
  };

  const applyFilters = () => {
    let filtered = [...cars];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.model_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.brand_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.brand_name_ar?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Branch filter
    if (selectedBranch !== "all") {
      filtered = filtered.filter((car) => car.branch_id === selectedBranch);
    }

    // Brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter((car) => {
        // Need to get brand_id from model
        return true; // Will implement proper filtering
      });
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((car) => car.status === selectedStatus);
    }

    // Rental types filter
    if (selectedRentalTypes.length > 0) {
      filtered = filtered.filter((car) =>
        selectedRentalTypes.some((type) => car.rental_types.includes(type))
      );
    }

    setFilteredCars(filtered);
  };

  const handleDeleteClick = async (car: Car) => {
    setSelectedCar(car);
    
    // Check active bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("car_id", car.id)
      .in("status", ["pending", "confirmed", "active"]);

    setActiveBookingsCount(bookings?.length || 0);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCar) return;

    if (activeBookingsCount > 0) {
      toast({
        title: "لا يمكن الحذف",
        description: `هذه السيارة لديها ${activeBookingsCount} حجز نشط. يمكنك إخفاء السيارة بدلاً من حذفها.`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      // Delete images from storage
      if (selectedCar.additional_images?.length > 0) {
        await supabase.storage.from("car-images").remove(selectedCar.additional_images);
      }

      // Delete car
      const { error } = await supabase.from("cars").delete().eq("id", selectedCar.id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف السيارة بنجاح",
      });

      fetchCars();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCar(null);
    }
  };

  const toggleRentalType = (type: string) => {
    setSelectedRentalTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

const getImageUrl = (car: Car) => {
  return car.default_image_url || "/placeholder.svg";
};

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة السيارات"
        description="عرض وإدارة جميع السيارات في النظام"
        action={
          <Button onClick={() => navigate("/admin/cars/add")}>
            <Plus className="h-4 w-4" />
            إضافة سيارة
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="بحث عن سيارة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="الفرع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفروع</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger>
              <SelectValue placeholder="البراند" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع البراندات</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="available">متاحة</SelectItem>
              <SelectItem value="rented">مؤجرة</SelectItem>
              <SelectItem value="maintenance">صيانة</SelectItem>
              <SelectItem value="hidden">مخفية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <span className="text-sm font-medium">أنواع التأجير:</span>
          {["daily", "weekly", "monthly", "ownership"].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedRentalTypes.includes(type)}
                onCheckedChange={() => toggleRentalType(type)}
              />
              <span className="text-sm">
                {type === "daily" && "يومي"}
                {type === "weekly" && "أسبوعي"}
                {type === "monthly" && "شهري"}
                {type === "ownership" && "ملكية"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الصورة</TableHead>
              <TableHead>السيارة</TableHead>
              <TableHead>الفرع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الكمية</TableHead>
              <TableHead>السعر اليومي</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCars.map((car) => (
              <TableRow key={car.id}>
                <TableCell>
                  <img
                    src={getImageUrl(car)}
                    alt={car.model_name_en || ""}
                    className="w-16 h-16 object-cover rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {car.brand_name_ar || car.brand_name_en} {car.model_name_ar || car.model_name_en}
                    </div>
                    {car.color_hex_code && (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: car.color_hex_code || "#000" }}
                        />
                        <span className="text-sm text-muted-foreground">{car.color_name_ar || car.color_name_en}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{car.branch_name_ar || car.branch_name_en || '-'}</TableCell>
                <TableCell>
                  <Badge className={statusColors[car.status as keyof typeof statusColors]}>
                    {statusLabels[car.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {car.actual_available_quantity}/{car.quantity}
                </TableCell>
                <TableCell>{car.daily_price} ر.س</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => navigate(`/admin/cars/${car.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => navigate(`/admin/cars/${car.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(car)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  <p>لا يمكن حذف السيارة. يمكنك إخفاء السيارة بدلاً من حذفها لمنع ظهورها في الحجوزات الجديدة.</p>
                </div>
              ) : (
                <p>هل أنت متأكد من حذف هذه السيارة؟ سيتم حذف جميع الصور المرتبطة بها.</p>
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
