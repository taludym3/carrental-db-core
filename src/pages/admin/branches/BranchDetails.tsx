import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { BranchStatsCard } from './components/BranchStatsCard';
import { BranchLocationMap } from './components/BranchLocationMap';
import { toast } from 'sonner';

export default function BranchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch-details', id],
    queryFn: async () => {
      const { data: branchData, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;

      let manager = null;
      if (branchData.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, email')
          .eq('user_id', branchData.manager_id)
          .single();
        manager = managerData;
      }

      const data = { ...branchData, manager };

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['branch-stats', id],
    queryFn: async () => {
      // عدد السيارات
      const { count: carsCount } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', id!);

      // عدد الموظفين
      const { data: employees } = await supabase
        .from('profiles')
        .select(`
          user_id,
          user_roles!inner(role)
        `)
        .eq('branch_id', id!);

      const employeesCount = employees?.filter(
        (e: any) => e.user_roles?.role === 'branch_employee'
      ).length || 0;

      // الحجوزات النشطة
      const { count: activeBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', id!)
        .in('status', ['pending', 'confirmed', 'payment_pending', 'active']);

      return {
        carsCount: carsCount || 0,
        employeesCount,
        activeBookings: activeBookings || 0,
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">الفرع غير موجود</h2>
        <Button asChild>
          <Link to="/admin/branches">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Link>
        </Button>
      </div>
    );
  }

  const openInMaps = () => {
    if (branch.latitude && branch.longitude) {
      window.open(
        `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`,
        '_blank'
      );
    } else {
      toast.error('الموقع الجغرافي غير محدد');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/branches">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {branch.name_ar || branch.name_en}
              </h1>
              <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                {branch.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
            {branch.name_en && branch.name_ar && (
              <p className="text-muted-foreground mt-1">{branch.name_en}</p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link to={`/admin/branches/${id}/edit`}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BranchStatsCard
          icon={Building2}
          title="السيارات"
          value={stats?.carsCount || 0}
          description="إجمالي السيارات"
        />
        <BranchStatsCard
          icon={User}
          title="الموظفين"
          value={stats?.employeesCount || 0}
          description="موظفو الفرع"
        />
        <BranchStatsCard
          icon={Clock}
          title="الحجوزات النشطة"
          value={stats?.activeBookings || 0}
          description="الحجوزات الحالية"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">
                    {branch.location_ar || branch.location_en}
                  </p>
                  {branch.location_en && branch.location_ar && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {branch.location_en}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{branch.phone}</p>
                </div>
              </div>

              {branch.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      البريد الإلكتروني
                    </p>
                    <p className="font-medium">{branch.email}</p>
                  </div>
                </div>
              )}

              {branch.working_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">ساعات العمل</p>
                    <p className="font-medium whitespace-pre-line">
                      {branch.working_hours}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(branch.latitude && branch.longitude) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={openInMaps}
              >
                <ExternalLink className="ml-2 h-4 w-4" />
                فتح في خرائط Google
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Manager Info */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المدير</CardTitle>
          </CardHeader>
          <CardContent>
            {branch.manager ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{(branch.manager as any)?.full_name || 'غير محدد'}</p>
                    <p className="text-sm text-muted-foreground">مدير الفرع</p>
                  </div>
                </div>

                {(branch.manager as any)?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{(branch.manager as any).phone}</p>
                    </div>
                  </div>
                )}

                {(branch.manager as any)?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">البريد</p>
                      <p className="font-medium">{(branch.manager as any).email}</p>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/admin/users/${(branch.manager as any)?.user_id}`}>
                    <User className="ml-2 h-4 w-4" />
                    عرض ملف المدير
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">لم يتم تعيين مدير لهذا الفرع</p>
                <Button variant="outline" asChild>
                  <Link to={`/admin/branches/${id}/edit`}>
                    تعيين مدير
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {branch.latitude && branch.longitude && (
        <Card>
          <CardHeader>
            <CardTitle>الموقع على الخريطة</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchLocationMap
              latitude={branch.latitude}
              longitude={branch.longitude}
              readonly
            />
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {(branch.description_ar || branch.description_en) && (
        <Card>
          <CardHeader>
            <CardTitle>الوصف</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">
              {branch.description_ar || branch.description_en}
            </p>
            {branch.description_en && branch.description_ar && (
              <p className="text-muted-foreground mt-4 whitespace-pre-line">
                {branch.description_en}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
