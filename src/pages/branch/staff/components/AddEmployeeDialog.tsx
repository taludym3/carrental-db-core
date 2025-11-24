import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const formSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل'),
});

type FormData = z.infer<typeof formSchema>;

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
}

export function AddEmployeeDialog({ open, onOpenChange, branchId }: AddEmployeeDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (values: FormData) => {
      const { data, error } = await supabase.rpc('add_branch_employee', {
        p_full_name: values.full_name,
        p_email: values.email,
        p_phone: values.phone,
        p_branch_id: branchId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to add employee');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('تم إضافة الموظف بنجاح', {
        description: 'تم إرسال إشعار للموظف الجديد مع تفاصيل الدخول',
      });
      queryClient.invalidateQueries({ queryKey: ['branch-employees'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الموظف');
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!branchId) {
      toast.error('لا يمكن تحديد الفرع');
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmployeeMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أضف موظف جديد إلى الفرع. سيتم إنشاء حساب جديد له وإرسال تفاصيل الدخول.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل *</FormLabel>
                  <FormControl>
                    <Input placeholder="محمد أحمد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="employee@example.com"
                      {...field}
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="05xxxxxxxx"
                      {...field}
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ سيتم إنشاء حساب جديد للموظف بكلمة مرور مؤقتة:{' '}
                <code className="bg-background px-2 py-1 rounded">TempPassword123!</code>
                <br />
                يجب على الموظف تغيير كلمة المرور عند أول دخول.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإضافة...' : 'إضافة موظف'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
