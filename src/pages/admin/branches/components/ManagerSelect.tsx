import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ManagerSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  currentManagerId?: string;
}

export function ManagerSelect({ value, onValueChange, currentManagerId }: ManagerSelectProps) {
  const { data: managers, isLoading } = useQuery({
    queryKey: ["branch-managers", currentManagerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_branch_managers', {
        p_current_manager_id: currentManagerId || null
      });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="جاري التحميل..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="اختر مدير الفرع (اختياري)" />
      </SelectTrigger>
      <SelectContent>
        {managers?.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            لا يوجد مدراء متاحين
          </div>
        )}
        {managers?.map((manager: any) => (
          <SelectItem 
            key={manager.user_id} 
            value={manager.user_id}
            disabled={manager.is_assigned && manager.user_id !== currentManagerId}
          >
            {manager.full_name || manager.email}
            {manager.is_assigned && manager.user_id !== currentManagerId && " (معين لفرع آخر)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
