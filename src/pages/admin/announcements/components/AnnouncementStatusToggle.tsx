import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AnnouncementStatusToggleProps {
  announcementId: string;
  isActive: boolean;
}

export const AnnouncementStatusToggle = ({ announcementId, isActive }: AnnouncementStatusToggleProps) => {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('toggle_announcement_status', {
        p_announcement_id: announcementId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(isActive ? 'تم تعطيل الإعلان' : 'تم تفعيل الإعلان');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-details', announcementId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل تغيير حالة الإعلان');
    }
  });

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`status-${announcementId}`}
        checked={isActive}
        onCheckedChange={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
      />
      <Label htmlFor={`status-${announcementId}`} className="text-sm cursor-pointer">
        {isActive ? 'نشط' : 'معطل'}
      </Label>
    </div>
  );
};
