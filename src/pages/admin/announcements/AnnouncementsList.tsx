import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnnouncementCard } from './components/AnnouncementCard';
import { Skeleton } from '@/components/ui/skeleton';

const AnnouncementsList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.eq('is_active', true).or('expires_at.is.null,expires_at.gt.now()');
      } else if (activeTab === 'inactive') {
        query = query.eq('is_active', false);
      } else if (activeTab === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (!data) return [];
      
      // Fetch related data
      const enrichedData = await Promise.all(
        data.map(async (announcement) => {
          const [branchData, creatorData] = await Promise.all([
            announcement.branch_id 
              ? supabase.from('branches').select('name_ar').eq('id', announcement.branch_id).single()
              : Promise.resolve({ data: null }),
            supabase.from('profiles').select('full_name').eq('user_id', announcement.created_by).single()
          ]);
          
          return {
            ...announcement,
            branch: branchData.data,
            creator: creatorData.data
          };
        })
      );
      
      return enrichedData;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعلانات"
        action={
          <Button onClick={() => navigate('/admin/announcements/add')}>
            <Plus className="h-4 w-4" />
            إضافة إعلان
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="active">نشطة</TabsTrigger>
          <TabsTrigger value="inactive">معطلة</TabsTrigger>
          <TabsTrigger value="expired">منتهية</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : announcements && announcements.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={() => navigate(`/admin/announcements/${announcement.id}`)}
                  onEdit={() => navigate(`/admin/announcements/${announcement.id}/edit`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد إعلانات
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnnouncementsList;
