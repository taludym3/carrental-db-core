import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, User, Mail, Phone } from "lucide-react";
import { DocumentReviewCard } from "./components/DocumentReviewCard";
import { BulkActionsBar } from "./components/BulkActionsBar";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

interface CustomerInfo {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_verified: boolean;
}

export default function CustomerDocumentsReview() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Fetch customer info
  const { data: customerInfo, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer-info", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, is_verified")
        .eq("user_id", customerId)
        .single();

      if (error) throw error;
      return data as CustomerInfo;
    },
  });

  // Fetch customer documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["customer-documents", customerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_customer_documents", {
        p_customer_id: customerId,
      });

      if (error) throw error;
      // Map the response to match our Document interface
      return (data || []).map((doc: any) => ({
        id: doc.document_id,
        document_type: doc.document_type,
        document_url: doc.document_url,
        status: doc.document_status,
        created_at: doc.created_at,
        rejection_reason: doc.rejection_reason,
      })) as Document[];
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      documentIds,
      status,
      rejectionReason,
    }: {
      documentIds: string[];
      status: "pending" | "approved" | "rejected";
      rejectionReason?: string;
    }) => {
      const { error } = await supabase.rpc("bulk_update_documents_status", {
        p_document_ids: documentIds,
        p_status: status,
        p_rejection_reason: rejectionReason,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-documents"] });
      queryClient.invalidateQueries({ queryKey: ["documents-by-status"] });
      setSelectedDocuments([]);
      toast.success("تم تحديث المستندات بنجاح");
    },
    onError: (error) => {
      console.error("Error updating documents:", error);
      toast.error("حدث خطأ أثناء تحديث المستندات");
    },
  });

  const handleBulkApprove = () => {
    const pendingDocs = documents?.filter(
      (doc) => doc.status === "pending" && selectedDocuments.includes(doc.id)
    );
    if (!pendingDocs || pendingDocs.length === 0) {
      toast.error("لا توجد مستندات معلقة للموافقة عليها");
      return;
    }
    bulkUpdateMutation.mutate({
      documentIds: pendingDocs.map((d) => d.id),
      status: "approved",
    });
  };

  const handleBulkReject = (reason: string) => {
    const pendingDocs = documents?.filter(
      (doc) => doc.status === "pending" && selectedDocuments.includes(doc.id)
    );
    if (!pendingDocs || pendingDocs.length === 0) {
      toast.error("لا توجد مستندات معلقة للرفض");
      return;
    }
    bulkUpdateMutation.mutate({
      documentIds: pendingDocs.map((d) => d.id),
      status: "rejected",
      rejectionReason: reason,
    });
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    const pendingDocs = documents?.filter((doc) => doc.status === "pending");
    if (selectedDocuments.length === pendingDocs?.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(pendingDocs?.map((doc) => doc.id) || []);
    }
  };

  const isLoading = isLoadingCustomer || isLoadingDocuments;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="مراجعة مستندات العميل"
          description="جارٍ تحميل البيانات..."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!customerInfo || !documents) {
    return (
      <div className="space-y-6">
        <PageHeader title="مراجعة مستندات العميل" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لم يتم العثور على بيانات العميل</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/admin/documents")}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة إلى قائمة المستندات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingDocuments = documents.filter((doc) => doc.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="مراجعة مستندات العميل"
        description="مراجعة جميع المستندات المقدمة من العميل"
        action={
          <Button
            variant="outline"
            onClick={() => navigate("/admin/documents")}
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة
          </Button>
        }
      />

      {/* Customer Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {customerInfo.full_name || "غير محدد"}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    {customerInfo.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {customerInfo.email}
                      </div>
                    )}
                    {customerInfo.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {customerInfo.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm text-muted-foreground">عدد المستندات</div>
              <div className="text-2xl font-bold">{documents.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {pendingDocuments.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedDocuments.length}
          totalPending={pendingDocuments.length}
          onSelectAll={handleSelectAll}
          onApproveAll={handleBulkApprove}
          onRejectAll={handleBulkReject}
          isLoading={bulkUpdateMutation.isPending}
        />
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لم يقم العميل بتحميل أي مستندات بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {documents.map((document) => (
            <DocumentReviewCard
              key={document.id}
              document={document}
              isSelected={selectedDocuments.includes(document.id)}
              onSelect={handleSelectDocument}
              onStatusChange={() => {
                queryClient.invalidateQueries({ queryKey: ["customer-documents"] });
                queryClient.invalidateQueries({ queryKey: ["documents-by-status"] });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
