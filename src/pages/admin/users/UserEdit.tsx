import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';

const userSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'branch', 'branch_employee', 'customer']),
  branch_id: z.string().optional(),
  is_verified: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: user ? {
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: (user.user_roles as any)?.[0]?.role || 'customer',
      branch_id: user.branch_id || undefined,
      is_verified: user.is_verified || false,
    } : undefined,
  });

  const selectedRole = watch('role');

  const { data: branches } = useQuery({
    queryKey: ['branches-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name_ar')
        .eq('is_active', true)
        .order('name_ar');
      
      if (error) throw error;
      return data;
    },
    enabled: selectedRole === 'branch' || selectedRole === 'branch_employee',
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          email: data.email,
          branch_id: data.branch_id || null,
          is_verified: data.is_verified,
        })
        .eq('user_id', id);

      if (profileError) throw profileError;

      // Update role
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);

      if (deleteRoleError) throw deleteRoleError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: id!,
          role: data.role,
        });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('تم تحديث بيانات المستخدم');
      navigate(`/admin/users/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ');
    },
  });

  const onSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/users/${id}`)}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل المستخدم</h1>
          <p className="text-muted-foreground mt-1">تحديث معلومات المستخدم</p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="أدخل الاسم الكامل"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+966XXXXXXXXX"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">الدور *</Label>
              <Select
                value={watch('role')}
                onValueChange={(value: any) => setValue('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">عميل</SelectItem>
                  <SelectItem value="branch_employee">موظف فرع</SelectItem>
                  <SelectItem value="branch">مدير فرع</SelectItem>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch (conditional) */}
            {(selectedRole === 'branch' || selectedRole === 'branch_employee') && (
              <div className="space-y-2">
                <Label htmlFor="branch_id">الفرع *</Label>
                <Select
                  value={watch('branch_id')}
                  onValueChange={(value) => setValue('branch_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Verified Status */}
            <div className="space-y-2">
              <Label htmlFor="is_verified">حالة التوثيق</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_verified"
                  checked={watch('is_verified')}
                  onCheckedChange={(checked) => setValue('is_verified', checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {watch('is_verified') ? 'موثق' : 'غير موثق'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/admin/users/${id}`)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
