import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DocumentStatusBadge } from '@/pages/admin/bookings/components/DocumentStatusBadge';
import { DocumentCard } from './components/DocumentCard';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';

type DocumentStatus = Database['public']['Enums']['document_status'];

const DocumentsList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'all' | DocumentStatus>('all');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-documents', activeTab],
    queryFn: async () => {
      const status = activeTab === 'all' ? null : activeTab;
      const { data, error } = await supabase.rpc('get_documents_by_status', {
        p_status: status as any,
        p_limit: 100,
        p_offset: 0
      });
      
      if (error) throw error;
      return data || [];
    }
  });

  const getStatusCount = (status: DocumentStatus) => {
    if (!documents) return 0;
    return documents.filter(d => d.document_status === status).length;
  };

  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      'national_id': 'الهوية الوطنية',
      'driving_license': 'رخصة القيادة',
      'passport': 'جواز السفر',
      'residence_permit': 'الإقامة',
      'other': 'أخرى'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="المستندات" />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">
            قيد المراجعة
            {getStatusCount('pending') > 0 && (
              <Badge variant="secondary" className="mr-2">
                {getStatusCount('pending')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">مقبولة</TabsTrigger>
          <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isMobile ? (
            <div className="space-y-4">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))
              ) : documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentCard
                    key={doc.document_id}
                    doc={doc}
                    onView={() => navigate(`/admin/documents/${doc.document_id}`)}
                    getDocumentTypeName={getDocumentTypeName}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد مستندات</h3>
                  <p className="text-muted-foreground">لم يتم العثور على أي مستندات</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المستند</TableHead>
                    <TableHead>نوع المستند</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>تاريخ الرفع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>من راجعه</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(9).fill(0).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <TableRow key={doc.document_id}>
                        <TableCell className="font-mono text-xs">
                          {doc.document_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {getDocumentTypeName(doc.document_type)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {doc.user_name?.charAt(0) || 'م'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{doc.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.user_email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.user_phone}
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <DocumentStatusBadge status={doc.document_status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.verified_by_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/documents/${doc.document_id}`)}
                            >
                              <Eye className="h-4 w-4" />
                              عرض
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        لا توجد مستندات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentsList;
