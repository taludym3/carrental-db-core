import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, 12);
  }, [center, map]);

  return null;
}

function LocationMarker({
  position,
  onLocationChange,
  readonly,
}: {
  position: [number, number];
  onLocationChange?: (lat: number, lng: number) => void;
  readonly: boolean;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useMapEvents({
    click(e) {
      if (!readonly && onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    const marker = markerRef.current;
    if (marker && !readonly) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange?.(pos.lat, pos.lng);
      });
    }
  }, [readonly, onLocationChange]);

  return (
    <Marker
      position={position}
      draggable={!readonly}
      ref={markerRef}
    />
  );
}

export function BranchLocationMap({
  latitude = 24.7136,
  longitude = 46.6753,
  onLocationChange,
  readonly = false,
}: BranchLocationMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="space-y-4">
      <div className="w-full h-96 rounded-lg border overflow-hidden">
        <MapContainer
          center={position}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={position} />
          <LocationMarker
            position={position}
            onLocationChange={onLocationChange}
            readonly={readonly}
          />
        </MapContainer>
      </div>

      {!readonly && (
        <p className="text-sm text-muted-foreground">
          💡 انقر على الخريطة أو اسحب العلامة لتحديد الموقع
        </p>
      )}
    </div>
  );
}
