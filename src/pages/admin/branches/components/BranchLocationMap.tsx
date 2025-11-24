import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
          onLocationChange(e.latlng.lat, e.latlng.lng);
        });
      }

      // Handle marker drag
      if (!readonly && onLocationChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
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

  return (
    <div className="space-y-4">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border overflow-hidden"
      />

      {!readonly && (
        <p className="text-sm text-muted-foreground">
          💡 انقر على الخريطة أو اسحب العلامة لتحديد الموقع
        </p>
      )}
    </div>
  );
}
