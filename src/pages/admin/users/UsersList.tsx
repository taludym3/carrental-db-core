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
import { Plus, Search, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { UserCard } from './components/UserCard';
import { UsersTableSkeleton } from './components/UsersTableSkeleton';
import { UsersCardsSkeleton } from './components/UsersCardsSkeleton';
import { UsersEmptyState } from './components/UsersEmptyState';

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
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const isMobile = useIsMobile();
  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, roleFilter],
    queryFn: async () => {
      // 1. Get profiles with branches
      let profilesQuery = supabase
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
          )
        `)
        .order('created_at', { ascending: false });

      if (debouncedSearch) {
        profilesQuery = profilesQuery.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // 2. Get all user roles
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      if (rolesError) throw rolesError;

      // 3. Merge data
      return profiles.map((profile: any) => ({
        id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        created_at: profile.created_at,
        is_verified: profile.is_verified,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || null,
        branch_name: profile.branches?.name_ar || null,
      })) as UserWithRole[];
    },
  });

  const filteredUsers = users?.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            عرض وإدارة جميع المستخدمين في النظام
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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

      {/* Content */}
      {isLoading ? (
        isMobile ? (
          <UsersCardsSkeleton />
        ) : (
          <UsersTableSkeleton />
        )
      ) : filteredUsers?.length === 0 ? (
        <Card>
          <UsersEmptyState hasSearch={!!debouncedSearch} />
        </Card>
      ) : isMobile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers?.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              roleLabels={roleLabels}
              roleColors={roleColors}
            />
          ))}
        </div>
      ) : (
        <Card>
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
              {filteredUsers?.map((user) => (
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
