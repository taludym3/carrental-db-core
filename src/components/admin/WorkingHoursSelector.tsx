import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Copy, Clock } from 'lucide-react';

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

const PRESETS = [
  { label: '٨ ص - ١٠ م', openTime: '08:00', closeTime: '22:00' },
  { label: '٩ ص - ٩ م', openTime: '09:00', closeTime: '21:00' },
  { label: '٢٤ ساعة', is24Hours: true },
];

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
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Parse existing value on mount
  useEffect(() => {
    if (value && !initialized) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setSchedule(parsed);
        }
      } catch (e) {
        // If not JSON, ignore and use defaults
      }
      setInitialized(true);
    }
  }, [value, initialized]);

  // Update parent when schedule changes (debounced)
  useEffect(() => {
    if (initialized) {
      onChange(JSON.stringify(schedule));
    }
  }, [schedule, initialized]);

  const updateDay = useCallback((index: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...updates } : day))
    );
  }, []);

  const applyToAllDays = useCallback(() => {
    const firstOpenDay = schedule.find((d) => d.isOpen);
    if (!firstOpenDay) return;

    setSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        isOpen: true,
        is24Hours: firstOpenDay.is24Hours,
        openTime: firstOpenDay.openTime,
        closeTime: firstOpenDay.closeTime,
      }))
    );
  }, [schedule]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        isOpen: true,
        is24Hours: preset.is24Hours || false,
        openTime: preset.openTime || '08:00',
        closeTime: preset.closeTime || '22:00',
      }))
    );
  }, []);

  const toggleDay = useCallback((index: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const getDisplayText = () => {
    const openDays = schedule.filter((d) => d.isOpen);
    if (openDays.length === 0) return 'الفرع مغلق';
    if (openDays.length === 7 && openDays.every((d) => d.is24Hours)) {
      return 'مفتوح 24 ساعة - جميع الأيام';
    }

    // Check if all days have the same hours
    const firstDay = openDays[0];
    const allSameHours = openDays.every(
      (d) =>
        d.is24Hours === firstDay.is24Hours &&
        d.openTime === firstDay.openTime &&
        d.closeTime === firstDay.closeTime
    );

    if (allSameHours && openDays.length === 7) {
      if (firstDay.is24Hours) {
        return 'مفتوح 24 ساعة - جميع الأيام';
      }
      return `${firstDay.openTime} - ${firstDay.closeTime} (جميع الأيام)`;
    }

    const closedDays = schedule.filter((d) => !d.isOpen);
    if (closedDays.length > 0 && closedDays.length <= 2) {
      const closedNames = closedDays.map((d) => d.dayAr).join('، ');
      if (allSameHours) {
        if (firstDay.is24Hours) {
          return `مفتوح 24 ساعة (مغلق: ${closedNames})`;
        }
        return `${firstDay.openTime} - ${firstDay.closeTime} (مغلق: ${closedNames})`;
      }
    }

    return `${openDays.length} أيام مفتوحة`;
  };

  const getDayStatusBadge = (day: DaySchedule) => {
    if (!day.isOpen) return 'مغلق';
    if (day.is24Hours) return '24 ساعة';
    return `${day.openTime} - ${day.closeTime}`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">{getDisplayText()}</p>
        </div>
      </Card>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">قوالب سريعة:</span>
        {PRESETS.map((preset, i) => (
          <Button
            key={i}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset)}
            className="h-7 text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Apply to All Button */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={applyToAllDays}
        className="w-full"
      >
        <Copy className="ml-2 h-4 w-4" />
        تطبيق أوقات اليوم الأول على جميع الأيام
      </Button>

      {/* Days Accordion */}
      <div className="space-y-2">
        {schedule.map((day, index) => (
          <Collapsible
            key={day.day}
            open={expandedDays.has(index)}
            onOpenChange={() => toggleDay(index)}
          >
            <Card className={`overflow-hidden transition-colors ${!day.isOpen ? 'opacity-60' : ''}`}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={day.isOpen}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) =>
                        updateDay(index, { isOpen: !!checked })
                      }
                    />
                    <span className="font-medium">{day.dayAr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${day.isOpen ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {getDayStatusBadge(day)}
                    </span>
                    {expandedDays.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {day.isOpen && (
                  <div className="p-3 pt-0 border-t space-y-3">
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
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">من</Label>
                          <Select
                            value={day.openTime}
                            onValueChange={(value) =>
                              updateDay(index, { openTime: value })
                            }
                          >
                            <SelectTrigger className="h-9">
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

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">إلى</Label>
                          <Select
                            value={day.closeTime}
                            onValueChange={(value) =>
                              updateDay(index, { closeTime: value })
                            }
                          >
                            <SelectTrigger className="h-9">
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
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};