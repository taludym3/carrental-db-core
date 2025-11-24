import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ReportExportButton } from "./ReportExportButton";

interface ReportsHeaderProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  selectedBranch: string | null;
  onBranchChange: (branchId: string | null) => void;
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
}

export function ReportsHeader({
  dateRange,
  onDateRangeChange,
  selectedBranch,
  onBranchChange,
  compareMode,
  onCompareModeChange,
}: ReportsHeaderProps) {
  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name_ar, is_active")
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      return data;
    },
  });

  const quickRanges = [
    {
      label: "آخر 7 أيام",
      getValue: () => ({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      }),
    },
    {
      label: "آخر 30 يوم",
      getValue: () => ({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      }),
    },
    {
      label: "آخر 90 يوم",
      getValue: () => ({
        from: new Date(new Date().setDate(new Date().getDate() - 90)),
        to: new Date(),
      }),
    },
    {
      label: "هذا الشهر",
      getValue: () => ({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      }),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="التقارير والإحصائيات"
        description="تقارير شاملة عن جميع عمليات النظام"
        action={
          <ReportExportButton
            dateRange={dateRange}
            branchId={selectedBranch}
          />
        }
      />

      <div className="flex flex-wrap gap-4 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-right font-normal")}>
              <CalendarIcon className="ml-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "PPP", { locale: ar })} -{" "}
                    {format(dateRange.to, "PPP", { locale: ar })}
                  </>
                ) : (
                  format(dateRange.from, "PPP", { locale: ar })
                )
              ) : (
                <span>اختر الفترة الزمنية</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2 border-b">
              {quickRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onDateRangeChange(range.getValue())}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              locale={ar}
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedBranch || "all"} onValueChange={(v) => onBranchChange(v === "all" ? null : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع الفروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفروع</SelectItem>
            {branches?.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            id="compare-mode"
            checked={compareMode}
            onCheckedChange={onCompareModeChange}
          />
          <Label htmlFor="compare-mode">مقارنة مع الفترة السابقة</Label>
        </div>
      </div>
    </div>
  );
}