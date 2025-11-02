import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Phone, Mail, MapPin, Calendar } from 'lucide-react';

type UserRole = 'admin' | 'branch' | 'branch_employee' | 'customer';

interface UserCardProps {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_verified: boolean;
    role: UserRole | null;
    branch_name: string | null;
  };
  roleLabels: Record<UserRole, string>;
  roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'>;
}

export const UserCard = ({ user, roleLabels, roleColors }: UserCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {user.full_name?.[0]?.toUpperCase() || '؟'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">
              {user.full_name || 'غير محدد'}
            </p>
            {user.role && (
              <Badge variant={roleColors[user.role]} className="mt-1">
                {roleLabels[user.role]}
              </Badge>
            )}
            {!user.role && (
              <Badge variant="secondary" className="mt-1">
                غير محدد
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to={`/admin/users/${user.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        {user.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        
        {user.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
        
        {user.branch_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{user.branch_name}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Calendar className="h-3 w-3" />
            <span>{new Date(user.created_at).toLocaleDateString('ar-SA')}</span>
          </div>
          <Badge variant={user.is_verified ? 'default' : 'secondary'} className="text-xs">
            {user.is_verified ? 'موثق' : 'غير موثق'}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
