import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, Loader2 } from 'lucide-react';

type UserRole = 'admin' | 'branch' | 'branch_employee' | 'customer';

interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  is_verified: boolean;
  role: UserRole | null;
  branch_name: string | null;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'مدير النظام',
  branch: 'مدير فرع',
  branch_employee: 'موظف فرع',
  customer: 'عميل',
};

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'> = {
  admin: 'destructive',
  branch: 'default',
  branch_employee: 'secondary',
  customer: 'default',
};

export default function UsersList() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          created_at,
          is_verified,
          branch_id,
          branches (
            name_ar
          ),
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((user: any) => ({
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        is_verified: user.is_verified,
        role: user.user_roles?.[0]?.role || null,
        branch_name: user.branches?.name_ar || null,
      })) as UserWithRole[];
    },
  });

  const filteredUsers = users?.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">
            عرض وإدارة جميع المستخدمين في النظام
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users/add">
            <Plus className="ml-2 h-4 w-4" />
            إضافة مستخدم
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو البريد أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="admin">مدير النظام</SelectItem>
              <SelectItem value="branch">مدير فرع</SelectItem>
              <SelectItem value="branch_employee">موظف فرع</SelectItem>
              <SelectItem value="customer">عميل</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'غير محدد'}
                    </TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">غير محدد</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.branch_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                        {user.is_verified ? 'موثق' : 'غير موثق'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
