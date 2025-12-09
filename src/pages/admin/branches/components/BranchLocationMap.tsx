import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Crosshair, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface BranchLocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  readonly?: boolean;
}

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function BranchLocationMap({
  latitude = 24.7136,
  longitude = 46.6753,
  onLocationChange,
  readonly = false,
}: BranchLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: latitude, lng: longitude });

  useEffect(() => {
    setCurrentCoords({ lat: latitude, lng: longitude });
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([latitude, longitude], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Create marker
      const marker = L.marker([latitude, longitude], {
        draggable: !readonly,
      }).addTo(map);

      // Handle map click
      if (!readonly && onLocationChange) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          onLocationChange(e.latlng.lat, e.latlng.lng);
        });
      }

      // Handle marker drag
      if (!readonly && onLocationChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCurrentCoords({ lat: pos.lat, lng: pos.lng });
          onLocationChange(pos.lat, pos.lng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update map view and marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = L.latLng(latitude, longitude);
      mapInstanceRef.current.flyTo(newLatLng, 12);
      markerRef.current.setLatLng(newLatLng);
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCurrentCoords({ lat, lng });
        
        if (mapInstanceRef.current && markerRef.current) {
          const newLatLng = L.latLng(lat, lng);
          mapInstanceRef.current.flyTo(newLatLng, 15);
          markerRef.current.setLatLng(newLatLng);
        }
        
        if (onLocationChange) {
          onLocationChange(lat, lng);
        }
        
        toast.success('تم تحديد موقعك بنجاح');
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('فشل في تحديد الموقع. تأكد من تفعيل خدمات الموقع');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCopyCoordinates = () => {
    const coordsText = `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsText);
    toast.success('تم نسخ الإحداثيات');
  };

  return (
    <div className="space-y-3">
      {/* Instructions */}
      {!readonly && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">انقر على الخريطة</strong> لتحديد موقع الفرع، أو <strong className="text-foreground">اسحب العلامة</strong> لضبط الموقع بدقة
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
          >
            <Crosshair className="ml-2 h-4 w-4" />
            {isLocating ? 'جاري التحديد...' : 'استخدام موقعي الحالي'}
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-lg border overflow-hidden"
      />

      {/* Coordinates Display */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="text-muted-foreground">الإحداثيات:</span>{' '}
            <code className="bg-background px-2 py-0.5 rounded text-xs">
              {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
            </code>
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyCoordinates}
          className="h-7"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}