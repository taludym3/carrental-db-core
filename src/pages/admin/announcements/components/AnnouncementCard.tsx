import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Star, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';
import { AnnouncementStatusToggle } from './AnnouncementStatusToggle';

type Announcement = Database['public']['Tables']['announcements']['Row'] & {
  branch?: { name_ar: string | null } | null;
  creator?: { full_name: string | null } | null;
};

interface AnnouncementCardProps {
  announcement: Announcement;
  onView: () => void;
  onEdit: () => void;
}

const getPriorityConfig = (priority: Database['public']['Enums']['announcement_priority']) => {
  const configs = {
    low: { label: 'منخفضة', className: 'bg-gray-100 text-gray-800' },
    normal: { label: 'عادية', className: 'bg-blue-100 text-blue-800' },
    high: { label: 'عالية', className: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'عاجلة', className: 'bg-red-100 text-red-800' }
  };
  return configs[priority] || configs.normal;
};

export const AnnouncementCard = ({ announcement, onView, onEdit }: AnnouncementCardProps) => {
  const priorityConfig = getPriorityConfig(announcement.priority);
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt={announcement.title_ar || announcement.title_en}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">لا توجد صورة</span>
          </div>
        )}
        {announcement.is_featured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 ml-1 fill-current" />
              مميز
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            {announcement.title_ar || announcement.title_en}
          </h3>
          <Badge className={priorityConfig.className}>
            {priorityConfig.label}
          </Badge>
        </div>
        
        {announcement.description_ar && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {announcement.description_ar}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{announcement.branch?.name_ar || 'جميع الفروع'}</span>
        </div>
        
        {announcement.expires_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              ينتهي: {format(new Date(announcement.expires_at), 'dd MMM yyyy', { locale: ar })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <AnnouncementStatusToggle
            announcementId={announcement.id}
            isActive={announcement.is_active}
          />
          {isExpired && (
            <Badge variant="destructive">منتهي</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" onClick={onView} className="flex-1">
          <Eye className="h-4 w-4" />
          عرض
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
          <Edit className="h-4 w-4" />
          تعديل
        </Button>
      </CardFooter>
    </Card>
  );
};
