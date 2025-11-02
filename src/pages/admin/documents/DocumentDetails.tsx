import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Download, ExternalLink, User, FileText } from 'lucide-react';
import { DocumentStatusBadge } from '@/pages/admin/bookings/components/DocumentStatusBadge';
import { ApproveDocumentDialog } from './components/ApproveDocumentDialog';
import { RejectDocumentDialog } from './components/RejectDocumentDialog';
import { ChangeDocumentStatusDialog } from './components/ChangeDocumentStatusDialog';
import { DocumentPreview } from './components/DocumentPreview';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const DocumentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading } = useQuery({
    queryKey: ['document-details', id],
    queryFn: async () => {
      if (!id) throw new Error('No document ID');
      
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (docError) throw docError;
      
      // Fetch user data
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .eq('user_id', docData.user_id)
        .single();
      
      // Fetch verifier data if exists
      let verifierData = null;
      if (docData.verified_by) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', docData.verified_by)
          .single();
        verifierData = data;
      }
      
      const data = {
        ...docData,
        user: userData,
        verifier: verifierData
      };
      
      // Get user stats
      const [bookingsCount, docsCount] = await Promise.all([
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', data.user_id),
        supabase
          .from('documents')
          .select('status', { count: 'exact' })
          .eq('user_id', data.user_id)
      ]);
      
      return {
        ...data,
        user_stats: {
          bookings_count: bookingsCount.count || 0,
          documents_approved: docsCount.data?.filter(d => d.status === 'approved').length || 0,
          documents_pending: docsCount.data?.filter(d => d.status === 'pending').length || 0,
          documents_rejected: docsCount.data?.filter(d => d.status === 'rejected').length || 0
        }
      };
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-6">
      <PageHeader
        title="المستند غير موجود"
        action={
          <Button variant="outline" onClick={() => navigate('/admin/documents')}>
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </Button>
        }
      />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            لم يتم العثور على المستند
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <PageHeader
        title="تفاصيل المستند"
        action={
          <Button variant="outline" onClick={() => navigate('/admin/documents')}>
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معلومات المستند
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">رقم المستند</label>
              <p className="font-mono text-sm mt-1">{document.id}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">نوع المستند</label>
              <p className="font-medium mt-1">{getDocumentTypeName(document.document_type)}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">الحالة</label>
              <div className="mt-1">
                <DocumentStatusBadge status={document.status} />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">تاريخ الرفع</label>
              <p className="mt-1">{format(new Date(document.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}</p>
            </div>
            
            {document.verified_at && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">تمت المراجعة بواسطة</label>
                  <p className="mt-1">{document.verifier?.full_name || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">تاريخ المراجعة</label>
                  <p className="mt-1">{format(new Date(document.verified_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}</p>
                </div>
              </>
            )}
            
            {document.rejection_reason && (
              <div>
                <label className="text-sm text-muted-foreground">سبب الرفض</label>
                <p className="mt-1 text-destructive">{document.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات المستخدم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {document.user?.full_name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{document.user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{document.user?.email}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">رقم الهاتف</label>
              <p className="mt-1">{document.user?.phone}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm text-muted-foreground">الحجوزات</label>
                <p className="text-2xl font-bold mt-1">{document.user_stats?.bookings_count || 0}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">المستندات المقبولة</label>
                <p className="text-2xl font-bold mt-1 text-green-600">{document.user_stats?.documents_approved || 0}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/bookings?customer=${document.user_id}`)}
                className="flex-1"
              >
                عرض الحجوزات
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/documents?user=${document.user_id}`)}
                className="flex-1"
              >
                كل المستندات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معاينة المستند</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentPreview url={document.document_url} type={document.document_type} />
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.storage
                    .from('documents')
                    .createSignedUrl(document.document_url, 3600);
                  
                  if (error) throw error;
                  if (data) window.open(data.signedUrl, '_blank');
                } catch (err) {
                  console.error('Error opening document:', err);
                  toast({
                    title: 'خطأ',
                    description: 'فشل فتح المستند',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
              فتح في نافذة جديدة
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.storage
                    .from('documents')
                    .download(document.document_url);
                  
                  if (error) throw error;
                  if (data) {
                    const url = URL.createObjectURL(data);
                    const a = window.document.createElement('a');
                    a.href = url;
                    a.download = `document-${document.id}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                } catch (err) {
                  console.error('Error downloading document:', err);
                  toast({
                    title: 'خطأ',
                    description: 'فشل تحميل المستند',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
              تحميل المستند
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإجراءات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {document.status === 'pending' ? (
              <>
                <ApproveDocumentDialog documentId={document.id} />
                <RejectDocumentDialog documentId={document.id} />
              </>
            ) : (
              <ChangeDocumentStatusDialog 
                documentId={document.id} 
                currentStatus={document.status}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentDetails;
