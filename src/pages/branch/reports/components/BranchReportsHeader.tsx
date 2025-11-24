import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BranchReportsHeaderProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function BranchReportsHeader({ dateRange, onDateRangeChange }: BranchReportsHeaderProps) {
  const handleExport = () => {
    // Export functionality placeholder
    console.log('تصدير التقرير...');
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">تقارير الفرع</h1>
        <p className="text-muted-foreground">تحليلات أداء مخصصة للفرع</p>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('justify-start text-left font-normal')}>
              <CalendarIcon className="ml-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy', { locale: ar })} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy', { locale: ar })}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy', { locale: ar })
                )
              ) : (
                <span>اختر التاريخ</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{ from: dateRange?.from, to: dateRange?.to }}
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

        <Button onClick={handleExport} variant="outline">
          <Download className="ml-2 h-4 w-4" />
          تصدير
        </Button>
      </div>
    </div>
  );
}
