import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, ExternalLink } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CustomerDocumentsDialogProps {
  customerId: string;
}

export const CustomerDocumentsDialog = ({ customerId }: CustomerDocumentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['customer-documents', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_customer_documents', {
        p_customer_id: customerId
      });
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const filteredDocuments = documents?.filter(doc => 
    activeTab === 'all' ? true : doc.document_status === activeTab
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4" />
          عرض المستندات
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>مستندات العميل</DialogTitle>
          <DialogDescription>
            جميع المستندات المرفوعة من قبل العميل
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="approved">مقبولة</TabsTrigger>
            <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
            <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredDocuments && filteredDocuments.length > 0 ? (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          رفع في: {format(new Date(doc.created_at), 'dd MMM yyyy, HH:mm', { locale: ar })}
                        </p>
                      </div>
                      <DocumentStatusBadge status={doc.document_status} />
                    </div>

                    {doc.verified_at && (
                      <div className="text-xs text-muted-foreground">
                        تم المراجعة في: {format(new Date(doc.verified_at), 'dd MMM yyyy, HH:mm', { locale: ar })}
                        {doc.verified_by_name && ` من قبل: ${doc.verified_by_name}`}
                      </div>
                    )}

                    {doc.rejection_reason && (
                      <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        <strong>سبب الرفض:</strong> {doc.rejection_reason}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(doc.document_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      عرض المستند
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد مستندات
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
