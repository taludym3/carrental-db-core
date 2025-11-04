import { useEffect, useRef } from 'react';

interface BranchLocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  readonly?: boolean;
}

export function BranchLocationMap({
  latitude = 24.7136,
  longitude = 46.6753,
  onLocationChange,
  readonly = false,
}: BranchLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Simplified map placeholder - Google Maps integration would require API key
    // For now, showing coordinates
  }, []);

  // Map update effect removed for simplification

  return (
    <div
      ref={mapRef}
      className="w-full h-96 rounded-lg border"
      style={{ minHeight: '384px' }}
    >
      {/* Fallback for when Google Maps is not available */}
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">خريطة Google Maps</p>
          <p className="text-sm text-muted-foreground">
            {readonly ? 'عرض الموقع' : 'انقر على الخريطة لتحديد الموقع'}
          </p>
          {latitude && longitude && (
            <p className="text-xs text-muted-foreground mt-2">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
