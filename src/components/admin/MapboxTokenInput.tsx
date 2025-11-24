import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MapboxTokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
}

export function MapboxTokenInput({ token, onTokenChange }: MapboxTokenInputProps) {
  return (
    <div className="space-y-2 mb-4">
      <Label htmlFor="mapbox-token">رمز Mapbox المؤقت</Label>
      <Input
        id="mapbox-token"
        type="text"
        placeholder="أدخل رمز Mapbox العام (Public Token)"
        value={token}
        onChange={(e) => onTokenChange(e.target.value)}
        dir="ltr"
      />
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          احصل على رمزك من{' '}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            حساب Mapbox
          </a>
        </AlertDescription>
      </Alert>
    </div>
  );
}
