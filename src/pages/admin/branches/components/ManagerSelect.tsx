import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ManagerSelectProps {
  value?: string; // ✅ خليها optional
  onValueChange: (value: string) => void;
  currentManagerId?: string;
}

export function ManagerSelect({ value, onValueChange, currentManagerId }: ManagerSelectProps) {
  const { data: managers, isLoading } = useQuery({
    queryKey: ["branch-managers", currentManagerId],
    queryFn: async () => {
      // Get all profiles with branch role
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select(`
          user_id,
          full_name,
          email,
          branch_id
        `);

      if (profilesError) throw profilesError;

      // Get user roles
      const userIds = profiles?.map((p) => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds)
        .eq("role", "branch");

      if (rolesError) throw rolesError;

      // Filter profiles that have branch role and not assigned to another branch
      const branchManagers = profiles?.filter((profile: any) => {
        const hasRole = roles?.some((r) => r.user_id === profile.user_id);
        const isCurrentManager = profile.user_id === currentManagerId;
        const isNotAssigned = !profile.branch_id;

        return hasRole && (isCurrentManager || isNotAssigned);
      });

      return branchManagers || [];
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
        {/* ✅ حذفنا السطر المشكل */}
        {managers?.map((manager: any) => (
          <SelectItem key={manager.user_id} value={manager.user_id}>
            {manager.full_name || manager.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
