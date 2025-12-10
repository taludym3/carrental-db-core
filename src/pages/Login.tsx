import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // توجيه المستخدم المسجل بالفعل إلى صفحته
  useEffect(() => {
    if (!authLoading && user && role) {
      // منع العملاء من الدخول
      if (role === 'customer') {
        toast.error('تسجيل الدخول غير متاح للعملاء حالياً');
        import('@/integrations/supabase/client').then(({ supabase }) => {
          supabase.auth.signOut();
        });
        return;
      }
      
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

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      setLoading(false);
      toast.error('خطأ في تسجيل الدخول', {
        description: error.message === 'Invalid login credentials' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
          : error.message
      });
      return;
    }

    toast.success('تم تسجيل الدخول بنجاح');
    // التوجيه يتم عبر useEffect بعد تحديث role في AuthContext
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-8 right-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">L</span>
          </div>
          <span className="text-2xl font-bold text-foreground">LEAGO</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription className="text-base">
            أدخل بياناتك للدخول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="example@leago.com"
                          className="pr-10 h-12 text-base"
                          disabled={loading}
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pr-10 h-12 text-base"
                          disabled={loading}
                          autoComplete="current-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>نسيت كلمة المرور؟ تواصل مع المسؤول</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
