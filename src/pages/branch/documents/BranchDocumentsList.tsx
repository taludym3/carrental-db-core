import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentStatusBadge } from '@/pages/admin/bookings/components/DocumentStatusBadge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const BranchDocumentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const { data: documents, isLoading } = useQuery({
    queryKey: ['branch-documents', profile?.branch_id, search, statusFilter],
    queryFn: async () => {
      if (!profile?.branch_id) return [];

      // Get users from branch
      const { data: branchUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('branch_id', profile.branch_id);

      if (!branchUsers || branchUsers.length === 0) return [];

      const userIds = branchUsers.map(u => u.user_id);

      let query = supabase
        .from('documents')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (search) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('full_name', `%${search}%`)
          .in('user_id', userIds);
        
        if (profiles && profiles.length > 0) {
          const searchUserIds = profiles.map(p => p.user_id);
          query = query.in('user_id', searchUserIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get user profiles
      const docUserIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', docUserIds);

      // Map profiles to documents
      return data?.map(doc => ({
        ...doc,
        user_profile: profiles?.find(p => p.user_id === doc.user_id)
      })) || [];
    },
    enabled: !!profile?.branch_id,
  });

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      national_id: 'الهوية الوطنية',
      driving_license: 'رخصة القيادة',
      passport: 'جواز السفر',
      insurance: 'التأمين',
      other: 'أخرى',
    };
    return types[type] || type;
  };

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
      <div>
        <h1 className="text-3xl font-bold">إدارة المستندات</h1>
        <p className="text-muted-foreground">قائمة مستندات عملاء الفرع</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن مستند..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="approved">موافق عليه</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !documents?.length ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد مستندات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>نوع المستند</TableHead>
                  <TableHead>تاريخ الرفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.user_profile?.full_name || 'عميل'}</p>
                        <p className="text-sm text-muted-foreground">{doc.user_profile?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/documents/${doc.id}`)}
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchDocumentsList;
