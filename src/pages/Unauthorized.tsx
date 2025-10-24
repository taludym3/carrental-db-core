import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <ShieldX className="h-24 w-24 text-destructive mx-auto" />
        <h1 className="text-4xl font-bold">غير مصرح لك</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          ليس لديك صلاحية الوصول إلى هذه الصفحة
        </p>
        <Link to="/">
          <Button size="lg">العودة للصفحة الرئيسية</Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
