import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaudiCitiesSelectorProps {
  locationAr: string;
  locationEn: string;
  onLocationArChange: (value: string) => void;
  onLocationEnChange: (value: string) => void;
}

const SAUDI_CITIES = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'مكة المكرمة', en: 'Makkah' },
  { ar: 'المدينة المنورة', en: 'Madinah' },
  { ar: 'الدمام', en: 'Dammam' },
  { ar: 'الخبر', en: 'Khobar' },
  { ar: 'الظهران', en: 'Dhahran' },
  { ar: 'الطائف', en: 'Taif' },
  { ar: 'تبوك', en: 'Tabuk' },
  { ar: 'بريدة', en: 'Buraidah' },
  { ar: 'خميس مشيط', en: 'Khamis Mushait' },
  { ar: 'الهفوف', en: 'Hofuf' },
  { ar: 'المبرز', en: 'Mubarraz' },
  { ar: 'حائل', en: 'Hail' },
  { ar: 'حفر الباطن', en: 'Hafar Al-Batin' },
  { ar: 'الجبيل', en: 'Jubail' },
  { ar: 'ينبع', en: 'Yanbu' },
  { ar: 'الخرج', en: 'Al-Kharj' },
  { ar: 'أبها', en: 'Abha' },
  { ar: 'عرعر', en: 'Arar' },
  { ar: 'سكاكا', en: 'Sakaka' },
  { ar: 'جازان', en: 'Jazan' },
  { ar: 'نجران', en: 'Najran' },
  { ar: 'القطيف', en: 'Qatif' },
  { ar: 'القنفذة', en: 'Al Qunfudhah' },
  { ar: 'رابغ', en: 'Rabigh' },
  { ar: 'أخرى', en: 'Other' },
];

export const SaudiCitiesSelector = ({
  locationAr,
  locationEn,
  onLocationArChange,
  onLocationEnChange,
}: SaudiCitiesSelectorProps) => {
  const handleCityChange = (value: string) => {
    const city = SAUDI_CITIES.find((c) => c.ar === value);
    if (city) {
      onLocationArChange(city.ar);
      onLocationEnChange(city.en);
    }
  };

  const selectedCity = SAUDI_CITIES.find((c) => c.ar === locationAr);
  const isOther = selectedCity?.ar === 'أخرى' || (!selectedCity && locationAr);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>المدينة</Label>
        <Select value={selectedCity?.ar || 'أخرى'} onValueChange={handleCityChange}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المدينة" />
          </SelectTrigger>
          <SelectContent>
            {SAUDI_CITIES.map((city) => (
              <SelectItem key={city.ar} value={city.ar}>
                {city.ar} ({city.en})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOther && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>الموقع بالعربية (مخصص)</Label>
            <Input
              value={locationAr}
              onChange={(e) => onLocationArChange(e.target.value)}
              placeholder="أدخل الموقع بالعربية"
            />
          </div>
          <div className="space-y-2">
            <Label>الموقع بالإنجليزية (مخصص)</Label>
            <Input
              value={locationEn}
              onChange={(e) => onLocationEnChange(e.target.value)}
              placeholder="Enter location in English"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>الحي / الشارع (اختياري)</Label>
        <Input
          placeholder="مثال: حي العليا، شارع الملك فهد"
          onChange={(e) => {
            if (selectedCity && selectedCity.ar !== 'أخرى') {
              const detail = e.target.value;
              if (detail) {
                onLocationArChange(`${selectedCity.ar}، ${detail}`);
                onLocationEnChange(`${selectedCity.en}, ${detail}`);
              } else {
                onLocationArChange(selectedCity.ar);
                onLocationEnChange(selectedCity.en);
              }
            }
          }}
        />
      </div>
    </div>
  );
};
