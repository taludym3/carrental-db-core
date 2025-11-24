import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ReportExportButtonProps {
  dateRange: { from: Date; to: Date };
  branchId: string | null;
}

export function ReportExportButton({ dateRange, branchId }: ReportExportButtonProps) {
  const handleExport = (format: "pdf" | "excel" | "csv") => {
    toast.success(`جاري تصدير التقرير بصيغة ${format.toUpperCase()}...`);
    // TODO: Implement actual export functionality
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          تصدير Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          تصدير CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}