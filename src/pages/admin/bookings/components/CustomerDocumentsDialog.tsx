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
import { FileText } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentPreview } from '@/pages/admin/documents/components/DocumentPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CustomerDocumentsDialogProps {
  customerId: string;
}

export const CustomerDocumentsDialog = ({ customerId }: CustomerDocumentsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

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
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>مستندات العميل</DialogTitle>
          <DialogDescription>
            جميع المستندات المرفوعة من قبل العميل
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(80vh-8rem)]">
          {/* قائمة المستندات */}
          <div className="overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="approved">مقبولة</TabsTrigger>
                <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
                <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filteredDocuments && filteredDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.document_id}
                        className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-colors ${
                          selectedDocument === doc.document_url 
                            ? 'border-primary bg-accent' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedDocument(doc.document_url)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{doc.document_type}</p>
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
                          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                            <strong>سبب الرفض:</strong> {doc.rejection_reason}
                          </div>
                        )}
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
          </div>

          {/* معاينة المستند */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {selectedDocument ? (
              <DocumentPreview url={selectedDocument} type="document" />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <FileText className="h-12 w-12 mx-auto opacity-50" />
                  <p>اختر مستنداً لعرضه</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
