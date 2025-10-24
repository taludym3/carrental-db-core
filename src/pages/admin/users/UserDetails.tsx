import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Edit, Mail, Phone, MapPin, Calendar, Shield, Building2, Loader2 } from 'lucide-react';

type UserRole = 'admin' | 'branch' | 'branch_employee' | 'customer';

const roleLabels: Record<UserRole, string> = {
  admin: 'مدير النظام',
  branch: 'مدير فرع',
  branch_employee: 'موظف فرع',
  customer: 'عميل',
};

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          branches (
            id,
            name_ar,
            location_ar
          ),
          user_roles (
            role
          )
        `)
        .eq('user_id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">المستخدم غير موجود</p>
      </div>
    );
  }

  const role = (user.user_roles as any)?.[0]?.role as UserRole | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تفاصيل المستخدم</h1>
            <p className="text-muted-foreground mt-1">عرض معلومات المستخدم الكاملة</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/admin/users/${id}/edit`}>
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Link>
        </Button>
      </div>

      {/* User Info Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">المعلومات الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium">{user.full_name || 'غير محدد'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium">{user.email || 'غير محدد'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{user.phone || 'غير محدد'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role & Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">الدور والحالة</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">الدور</p>
                {role ? (
                  <Badge variant="default" className="text-base py-1 px-3">
                    {roleLabels[role]}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-base py-1 px-3">
                    غير محدد
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">حالة التوثيق</p>
                <Badge
                  variant={user.is_verified ? 'default' : 'secondary'}
                  className="text-base py-1 px-3"
                >
                  {user.is_verified ? 'موثق' : 'غير موثق'}
                </Badge>
              </div>
              {user.phone_verified_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">توثيق الهاتف</p>
                  <Badge variant="default" className="text-base py-1 px-3">
                    موثق
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Branch Info (if applicable) */}
          {user.branches && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-4">معلومات الفرع</h2>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.branches.name_ar}</p>
                    {user.branches.location_ar && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {user.branches.location_ar}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          {(user.gender || user.age || user.location) && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold mb-4">معلومات إضافية</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground">الجنس</p>
                      <p className="font-medium">{user.gender}</p>
                    </div>
                  )}
                  {user.age && (
                    <div>
                      <p className="text-sm text-muted-foreground">العمر</p>
                      <p className="font-medium">{user.age} سنة</p>
                    </div>
                  )}
                  {user.location && (
                    <div>
                      <p className="text-sm text-muted-foreground">الموقع</p>
                      <p className="font-medium">{user.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
