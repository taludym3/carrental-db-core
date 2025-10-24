import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Specifications {
  power?: string;
  engine?: string;
  drivetrain?: string;
  fuel_economy?: string;
  transmission?: string;
}

interface SpecificationsInputProps {
  form: UseFormReturn<any>;
  initialValue?: Specifications | string;
}

const drivetrainOptions = [
  { value: 'FWD', label: 'FWD - دفع أمامي' },
  { value: 'RWD', label: 'RWD - دفع خلفي' },
  { value: 'AWD', label: 'AWD - دفع رباعي دائم' },
  { value: '4WD', label: '4WD - دفع رباعي' },
];

export const SpecificationsInput = ({ form, initialValue }: SpecificationsInputProps) => {
  // Parse initial value if it's a string
  useEffect(() => {
    if (initialValue) {
      let specs: Specifications = {};
      if (typeof initialValue === 'string') {
        try {
          specs = JSON.parse(initialValue);
        } catch (e) {
          console.error('Failed to parse specifications:', e);
        }
      } else {
        specs = initialValue;
      }

      // Set individual field values
      form.setValue('spec_power', specs.power || '');
      form.setValue('spec_engine', specs.engine || '');
      form.setValue('spec_drivetrain', specs.drivetrain || '');
      form.setValue('spec_fuel_economy', specs.fuel_economy || '');
      form.setValue('spec_transmission', specs.transmission || '');
    }
  }, [initialValue, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>المواصفات الفنية</CardTitle>
        <CardDescription>أدخل المواصفات التقنية للموديل (جميع الحقول اختيارية)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Power */}
          <div className="space-y-2">
            <Label htmlFor="spec_power">
              القوة الحصانية
              <span className="text-xs text-muted-foreground mr-2">(مثال: 255 HP)</span>
            </Label>
            <Input
              id="spec_power"
              placeholder="255 HP"
              {...form.register('spec_power')}
            />
          </div>

          {/* Engine */}
          <div className="space-y-2">
            <Label htmlFor="spec_engine">
              المحرك
              <span className="text-xs text-muted-foreground mr-2">(مثال: 2.0L Turbo 4-Cylinder)</span>
            </Label>
            <Input
              id="spec_engine"
              placeholder="2.0L Turbo 4-Cylinder"
              {...form.register('spec_engine')}
            />
          </div>

          {/* Drivetrain */}
          <div className="space-y-2">
            <Label htmlFor="spec_drivetrain">نظام الدفع</Label>
            <Select
              value={form.watch('spec_drivetrain') || ''}
              onValueChange={(value) => form.setValue('spec_drivetrain', value)}
            >
              <SelectTrigger id="spec_drivetrain">
                <SelectValue placeholder="اختر نظام الدفع" />
              </SelectTrigger>
              <SelectContent>
                {drivetrainOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fuel Economy */}
          <div className="space-y-2">
            <Label htmlFor="spec_fuel_economy">
              استهلاك الوقود
              <span className="text-xs text-muted-foreground mr-2">(مثال: 25 MPG Combined)</span>
            </Label>
            <Input
              id="spec_fuel_economy"
              placeholder="25 MPG Combined"
              {...form.register('spec_fuel_economy')}
            />
          </div>

          {/* Transmission */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spec_transmission">
              ناقل الحركة
              <span className="text-xs text-muted-foreground mr-2">(مثال: 9-Speed Automatic)</span>
            </Label>
            <Input
              id="spec_transmission"
              placeholder="9-Speed Automatic"
              {...form.register('spec_transmission')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
