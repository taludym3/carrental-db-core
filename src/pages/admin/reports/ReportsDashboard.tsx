import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsHeader } from "./components/ReportsHeader";
import { ReportsSummaryCards } from "./components/ReportsSummaryCards";
import { RevenueReport } from "./components/RevenueReport";
import { BranchesReport } from "./components/BranchesReport";
import { CarsReport } from "./components/CarsReport";
import { DocumentsReport } from "./components/DocumentsReport";
import { ComparisonReport } from "./components/ComparisonReport";

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  return (
    <div className="space-y-6">
      <ReportsHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />

      <ReportsSummaryCards
        dateRange={dateRange}
        branchId={selectedBranch}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="branches">الفروع</TabsTrigger>
          <TabsTrigger value="cars">السيارات</TabsTrigger>
          <TabsTrigger value="documents">الوثائق</TabsTrigger>
          <TabsTrigger value="comparison">المقارنة</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RevenueReport dateRange={dateRange} branchId={selectedBranch} compact />
          <BranchesReport dateRange={dateRange} compact />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueReport dateRange={dateRange} branchId={selectedBranch} />
        </TabsContent>

        <TabsContent value="branches">
          <BranchesReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="cars">
          <CarsReport dateRange={dateRange} branchId={selectedBranch} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonReport dateRange={dateRange} compareMode={compareMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}