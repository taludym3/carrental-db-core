import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentStatusBadge } from "@/pages/admin/bookings/components/DocumentStatusBadge";
import type { Database } from "@/integrations/supabase/types";

type DocumentStatus = Database["public"]["Enums"]["document_status"];

const DocumentsListGrouped = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | DocumentStatus>("all");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-documents", activeTab],
    queryFn: async () => {
      const status = activeTab === "all" ? null : activeTab;
      const { data, error } = await supabase.rpc("get_documents_by_status", {
        p_status: status as any,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusCount = (status: DocumentStatus) => {
    if (!documents) return 0;
    return documents.filter((d) => d.document_status === status).length;
  };

  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      national_id: "الهوية الوطنية",
      drivers_license: "رخصة القيادة",
      passport: "جواز السفر",
      residency_permit: "الإقامة",
      vehicle_registration: "رخصة السيارة",
    };
    return types[type] || type;
  };

  // Group documents by customer
  const groupedDocuments = documents?.reduce((acc, doc) => {
    const key = doc.user_id;
    if (!acc[key]) {
      acc[key] = {
        customerId: key,
        customerName: doc.user_name,
        customerEmail: doc.user_email,
        documents: [],
      };
    }
    acc[key].documents.push(doc);
    return acc;
  }, {} as Record<string, { customerId: string; customerName: string; customerEmail: string; documents: any[] }>);

  const customerGroups = groupedDocuments ? Object.values(groupedDocuments) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="المستندات" />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            الكل ({documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            قيد المراجعة ({getStatusCount("pending")})
          </TabsTrigger>
          <TabsTrigger value="approved">
            مقبولة ({getStatusCount("approved")})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            مرفوضة ({getStatusCount("rejected")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customerGroups.length > 0 ? (
            <div className="space-y-4">
              {customerGroups.map((group) => {
                const pendingCount = group.documents.filter(
                  (d) => d.document_status === "pending"
                ).length;

                return (
                  <Card
                    key={group.customerId}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      navigate(`/admin/customers/${group.customerId}/documents`)
                    }
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg">
                              {group.customerName?.[0] || "؟"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {group.customerName || "غير محدد"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {group.customerEmail || "لا يوجد بريد"}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.documents.map((doc) => (
                                <div
                                  key={doc.document_id}
                                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="h-3 w-3" />
                                  {getDocumentTypeName(doc.document_type)}
                                  <span className="mx-1">-</span>
                                  <DocumentStatusBadge
                                    status={doc.document_status}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {group.documents.length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              مستندات
                            </div>
                          </div>
                          {pendingCount > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-amber-600">
                                {pendingCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                قيد المراجعة
                              </div>
                            </div>
                          )}
                          <Button onClick={(e) => e.stopPropagation()}>
                            <Eye className="ml-2 h-4 w-4" />
                            مراجعة المستندات
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  لا توجد مستندات {activeTab !== "all" && `بحالة ${activeTab}`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentsListGrouped;
