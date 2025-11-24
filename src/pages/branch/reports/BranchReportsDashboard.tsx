import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BranchReportsHeader } from './components/BranchReportsHeader';
import { BranchSummaryCards } from './components/BranchSummaryCards';
import { BranchRevenueReport } from './components/BranchRevenueReport';
import { BranchCarsReport } from './components/BranchCarsReport';
import { BranchBookingsOverview } from './components/BranchBookingsOverview';

const BranchReportsDashboard = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Get branch_id for current user
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (!profile?.branch_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">لم يتم تعيين فرع لهذا المستخدم</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BranchReportsHeader dateRange={dateRange} onDateRangeChange={setDateRange} />
      
      <BranchSummaryCards dateRange={dateRange} branchId={profile.branch_id} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="cars">السيارات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BranchBookingsOverview dateRange={dateRange} branchId={profile.branch_id} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <BranchRevenueReport dateRange={dateRange} branchId={profile.branch_id} />
        </TabsContent>

        <TabsContent value="cars" className="space-y-4">
          <BranchCarsReport dateRange={dateRange} branchId={profile.branch_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchReportsDashboard;
