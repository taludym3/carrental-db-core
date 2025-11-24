import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error('خطأ في تسجيل الدخول', {
        description: error.message === 'Invalid login credentials' 
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' 
          : error.message
      });
      return;
    }

    toast.success('تم تسجيل الدخول بنجاح');

    // انتظر تحميل الدور وتوجيه المستخدم
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const role = roleData?.role;

      switch (role) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'branch':
        case 'branch_employee':
          navigate('/branch', { replace: true });
          break;
        case 'customer':
          toast.error('تسجيل الدخول غير متاح للعملاء حالياً');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        default:
          navigate(from, { replace: true });
      }
    } catch (err) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-8 right-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@leago.com"
                  className="pr-10 h-12 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pr-10 h-12 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

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

          <div className="mt-6 space-y-3">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">ليس لديك حساب؟ </span>
              <Link to="/register" className="text-primary font-semibold hover:underline">
                إنشاء حساب جديد
              </Link>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>نسيت كلمة المرور؟ تواصل مع المسؤول</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
