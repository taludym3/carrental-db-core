import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, Shield, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddEmployeeDialog } from './components/AddEmployeeDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

interface Employee {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  role: 'branch' | 'branch_employee';
}

export default function BranchStaffList() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  // التحقق من أن المستخدم مدير فرع
  const isBranchManager = role === 'branch';

  // جلب branch_id من profiles
  useQuery({
    queryKey: ['user-branch', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setBranchId(data.branch_id);
      return data.branch_id;
    },
    enabled: !!user?.id,
  });

  // جلب موظفي الفرع
  const { data: employees, isLoading } = useQuery({
    queryKey: ['branch-employees', branchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_branch_employees', {
        p_branch_id: branchId,
      });

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!branchId,
  });

  // تعطيل/تفعيل موظف
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase.rpc('toggle_branch_employee_status', {
        p_employee_user_id: userId,
        p_is_active: isActive,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update employee status');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة الموظف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['branch-employees'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء تحديث حالة الموظف');
    },
  });

  // حذف موظف
  const removeEmployeeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('remove_branch_employee', {
        p_employee_user_id: userId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove employee');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('تم حذف الموظف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['branch-employees'] });
      setDeleteEmployeeId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء حذف الموظف');
    },
  });

  // إذا كان المستخدم موظف فرع (وليس مدير)، عرض رسالة عدم الصلاحية
  if (role === 'branch_employee') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">غير مصرح لك</h2>
        <p className="text-muted-foreground text-center max-w-md">
          هذه الصفحة متاحة فقط لمدراء الفروع. لا يمكن لموظفي الفرع الوصول إلى إدارة الموظفين.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const managerCount = employees?.filter(e => e.role === 'branch').length || 0;
  const employeeCount = employees?.filter(e => e.role === 'branch_employee').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
          <p className="text-muted-foreground mt-1">
            إدارة موظفي الفرع والصلاحيات
          </p>
        </div>
        {isBranchManager && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة موظف
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">{employees?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المدراء</p>
                <p className="text-2xl font-bold">{managerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">موظفي الفرع</p>
                <p className="text-2xl font-bold">{employeeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          {!employees || employees.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">لا يوجد موظفين في هذا الفرع</p>
              {isBranchManager && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="ml-2 h-4 w-4" />
                  إضافة أول موظف
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    {isBranchManager && <TableHead>الإجراءات</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.user_id}>
                      <TableCell className="font-medium">
                        {employee.full_name || 'غير محدد'}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        {employee.role === 'branch' ? (
                          <Badge variant="default">
                            <Shield className="ml-1 h-3 w-3" />
                            مدير
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <User className="ml-1 h-3 w-3" />
                            موظف
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      {isBranchManager && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {employee.role !== 'branch' && (
                              <>
                                <Switch
                                  checked={employee.is_active}
                                  onCheckedChange={(checked) =>
                                    toggleStatusMutation.mutate({
                                      userId: employee.user_id,
                                      isActive: checked,
                                    })
                                  }
                                  disabled={toggleStatusMutation.isPending}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteEmployeeId(employee.user_id)}
                                  disabled={removeEmployeeMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        branchId={branchId || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteEmployeeId}
        onOpenChange={(open) => !open && setDeleteEmployeeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع بيانات الموظف بشكل نهائي ولا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEmployeeId && removeEmployeeMutation.mutate(deleteEmployeeId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
