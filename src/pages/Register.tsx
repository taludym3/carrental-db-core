import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { signUp, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // توجيه المستخدم المسجل بالفعل إلى صفحته
  useEffect(() => {
    if (!authLoading && user && role) {
      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'branch':
        case 'branch_employee':
          navigate('/branch', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    const { error } = await signUp(
      data.email, 
      data.password, 
      data.fullName || undefined
    );
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('هذا البريد الإلكتروني مسجل بالفعل');
      } else {
        toast.error('خطأ في التسجيل', {
          description: error.message
        });
      }
    } else {
      toast.success('تم التسجيل بنجاح!', {
        description: 'يمكنك الآن تسجيل الدخول'
      });
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="absolute top-8 right-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">L</span>
          </div>
          <span className="text-2xl font-bold text-foreground">LEAGO</span>
        </div>
      </div>

      {/* Register Card */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-base">
            أدخل بياناتك لإنشاء حساب في نظام LEAGO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Field (Optional) */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الاسم الكامل (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="أحمد محمد"
                        disabled={loading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@leago.com"
                        disabled={loading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      كلمة المرور *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={loading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      يجب أن تكون 6 أحرف على الأقل
                    </p>
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      تأكيد كلمة المرور *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={loading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التسجيل...
                  </>
                ) : (
                  'إنشاء حساب'
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
            <Link to="/login" className="text-primary font-semibold hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
