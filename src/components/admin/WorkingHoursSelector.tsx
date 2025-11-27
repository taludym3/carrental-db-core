import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DaySchedule {
  day: string;
  dayAr: string;
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
}

interface WorkingHoursSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const DAYS: Array<{ en: string; ar: string }> = [
  { en: 'Saturday', ar: 'السبت' },
  { en: 'Sunday', ar: 'الأحد' },
  { en: 'Monday', ar: 'الاثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

export const WorkingHoursSelector = ({ value, onChange }: WorkingHoursSelectorProps) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day: day.en,
      dayAr: day.ar,
      isOpen: true,
      is24Hours: false,
      openTime: '08:00',
      closeTime: '22:00',
    }))
  );

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setSchedule(parsed);
        }
      } catch (e) {
        // If not JSON, ignore and use defaults
      }
    }
  }, []);

  // Update parent when schedule changes
  useEffect(() => {
    onChange(JSON.stringify(schedule));
  }, [schedule, onChange]);

  const updateDay = (index: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...updates } : day))
    );
  };

  const getDisplayText = () => {
    const openDays = schedule.filter((d) => d.isOpen);
    if (openDays.length === 0) return 'الفرع مغلق';
    if (openDays.length === 7 && openDays.every((d) => d.is24Hours)) {
      return 'مفتوح 24 ساعة - جميع الأيام';
    }
    
    // Group consecutive days with same hours
    const groupedText = openDays.map((d) => {
      if (d.is24Hours) {
        return `${d.dayAr}: 24 ساعة`;
      }
      return `${d.dayAr}: ${d.openTime} - ${d.closeTime}`;
    }).join(' | ');
    
    return groupedText;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          <strong>ملخص:</strong> {getDisplayText()}
        </p>
      </Card>

      <div className="space-y-3">
        {schedule.map((day, index) => (
          <Card key={day.day} className="p-4">
            <div className="space-y-3">
              {/* Day and Open/Closed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={day.isOpen}
                    onCheckedChange={(checked) =>
                      updateDay(index, { isOpen: !!checked })
                    }
                  />
                  <Label className="text-base font-semibold">
                    {day.dayAr}
                  </Label>
                </div>
                {!day.isOpen && (
                  <span className="text-sm text-muted-foreground">مغلق</span>
                )}
              </div>

              {/* Hours Selection */}
              {day.isOpen && (
                <div className="mr-7 space-y-3">
                  {/* 24 Hours Checkbox */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={day.is24Hours}
                      onCheckedChange={(checked) =>
                        updateDay(index, { is24Hours: !!checked })
                      }
                    />
                    <Label className="text-sm">مفتوح 24 ساعة</Label>
                  </div>

                  {/* Time Selectors */}
                  {!day.is24Hours && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">من</Label>
                        <Select
                          value={day.openTime}
                          onValueChange={(value) =>
                            updateDay(index, { openTime: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((hour) => (
                              <SelectItem key={hour.value} value={hour.value}>
                                {hour.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">إلى</Label>
                        <Select
                          value={day.closeTime}
                          onValueChange={(value) =>
                            updateDay(index, { closeTime: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HOURS.map((hour) => (
                              <SelectItem key={hour.value} value={hour.value}>
                                {hour.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
