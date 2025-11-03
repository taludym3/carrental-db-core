import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Plus, Filter, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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

    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.model_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.brand_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.brand_name_ar?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedBranch !== "all") {
      filtered = filtered.filter((car) => car.branch_id === selectedBranch);
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter((car) => {
        return true;
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((car) => car.status === selectedStatus);
    }

    if (selectedRentalTypes.length > 0) {
      filtered = filtered.filter((car) => selectedRentalTypes.some((type) => car.rental_types.includes(type)));
    }

    setFilteredCars(filtered);
  };

  const handleDeleteClick = async (car: Car) => {
    setSelectedCar(car);

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
      if (selectedCar.additional_images?.length > 0) {
        await supabase.storage.from("car-images").remove(selectedCar.additional_images);
      }

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
    setSelectedRentalTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBranch("all");
    setSelectedBrand("all");
    setSelectedStatus("all");
    setSelectedRentalTypes([]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedBranch !== "all") count++;
    if (selectedBrand !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedRentalTypes.length > 0) count++;
    return count;
  };

  const getImageUrl = (car: Car) => {
    return car.default_image_url || "/placeholder.svg";
  };

  const FilterSection = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <Input
          placeholder="بحث عن سيارة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
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
                {brand.name_ar || brand.name_en}
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

      <div className="space-y-2">
        <span className="text-sm font-medium">أنواع التأجير:</span>
        <div className="space-y-2">
          {["daily", "weekly", "monthly", "ownership"].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selectedRentalTypes.includes(type)} onCheckedChange={() => toggleRentalType(type)} />
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

      {getActiveFiltersCount() > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 ml-2" />
          مسح الفلاتر ({getActiveFiltersCount()})
        </Button>
      )}
    </div>
  );

  const CarCard = ({ car }: { car: Car }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={getImageUrl(car)}
            alt={car.model_name_ar || car.model_name_en || ""}
            className="w-full h-48 object-cover"
          />
          <Badge className={`absolute top-2 right-2 ${statusColors[car.status as keyof typeof statusColors]}`}>
            {statusLabels[car.status as keyof typeof statusLabels]}
          </Badge>
          {car.discount_percentage && car.discount_percentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">خصم {car.discount_percentage}%</Badge>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-lg">
              {car.brand_name_ar || car.brand_name_en} {car.model_name_ar || car.model_name_en}
            </h3>
            {car.color_hex_code && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: car.color_hex_code }} />
                <span className="text-sm text-muted-foreground">{car.color_name_ar || car.color_name_en}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{car.branch_name_ar || car.branch_name_en || "-"}</span>
            <span>
              {car.actual_available_quantity}/{car.quantity} متاح
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">السعر اليومي</div>
              <div className="text-lg font-bold text-primary">{car.daily_price} ر.س</div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/cars/${car.id}`)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/cars/${car.id}/edit`)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(car)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <PageHeader
        title="إدارة السيارات"
        description="عرض وإدارة جميع السيارات في النظام"
        action={
          <Button onClick={() => navigate("/admin/cars/add")} size="sm" className="md:size-default">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline mr-2">إضافة سيارة</span>
          </Button>
        }
      />

      {/* Desktop Filters */}
      <div className="hidden md:block bg-card p-4 rounded-lg border">
        <FilterSection />
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden flex items-center gap-2">
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Filter className="h-4 w-4 ml-2" />
              الفلاتر
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>فلترة السيارات</SheetTitle>
              <SheetDescription>اختر الخيارات لتصفية قائمة السيارات</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterSection />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        عرض {filteredCars.length} من {cars.length} سيارة
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card rounded-lg border overflow-auto">
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
              <TableRow key={car.id} className="items-center">
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
                <TableCell>{car.branch_name_ar || car.branch_name_en || "-"}</TableCell>
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
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/cars/${car.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/cars/${car.id}/edit`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(car)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {filteredCars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>

      {/* Empty State */}
      {filteredCars.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">لا توجد سيارات</p>
          {getActiveFiltersCount() > 0 && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              مسح الفلاتر
            </Button>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {activeBookingsCount > 0 ? (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">هذه السيارة لديها {activeBookingsCount} حجز نشط!</p>
                  <p>لا يمكن حذف السيارة. يمكنك إخفاء السيارة بدلاً من حذفها لمنع ظهورها في الحجوزات الجديدة.</p>
                </div>
              ) : (
                <p>هل أنت متأكد من حذف هذه السيارة؟ سيتم حذف جميع الصور المرتبطة بها.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {activeBookingsCount === 0 && <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
