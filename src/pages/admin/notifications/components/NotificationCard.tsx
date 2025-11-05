import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationCardProps {
  notification: {
    id: string;
    title_ar: string;
    message_ar: string;
    type: string;
    is_read: boolean;
    created_at: string;
  };
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  getIcon: (type: string) => string;
}

export const NotificationCard = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  getIcon,
}: NotificationCardProps) => {
  return (
    <Card className={`p-4 ${!notification.is_read ? 'bg-muted/30' : ''}`}>
      <div className="flex gap-3">
        <span className="text-2xl">{getIcon(notification.type)}</span>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm">{notification.title_ar}</p>
            {!notification.is_read && (
              <Badge variant="default" className="shrink-0 text-xs">جديد</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {notification.message_ar}
          </p>
          
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ar,
            })}
          </p>

          <div className="flex items-center gap-2 pt-2">
            {!notification.is_read ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAsRead}
              >
                <Check className="h-3 w-3 ml-1" />
                تعليم كمقروء
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAsUnread}
              >
                <CheckCheck className="h-3 w-3 ml-1" />
                تعليم كغير مقروء
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 ml-1" />
              حذف
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
