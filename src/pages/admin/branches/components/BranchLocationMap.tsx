import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Fetch Mapbox token on mount
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        setIsLoadingToken(true);
        setTokenError(null);

        const { data, error } = await supabase.functions.invoke('get-mapbox-token');

        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setTokenError('فشل تحميل رمز الخريطة. يرجى المحاولة لاحقاً.');
          return;
        }

        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setTokenError('لم يتم إعداد رمز Mapbox. يرجى إضافة MAPBOX_PUBLIC_TOKEN في إعدادات Supabase.');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setTokenError('حدث خطأ أثناء تحميل الخريطة.');
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Initialize map when token is provided
  useEffect(() => {
    if (!mapRef.current || !mapboxToken || mapInitialized) return;

    try {
      mapboxgl.accessToken = mapboxToken;

      // Create map
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 12,
        attributionControl: false,
      });

      // Add navigation controls
      map.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      // Create draggable marker
      const marker = new mapboxgl.Marker({
        draggable: !readonly,
        color: '#ea384c',
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      // Handle marker drag
      if (!readonly) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onLocationChange?.(lngLat.lat, lngLat.lng);
        });

        // Handle map click
        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          onLocationChange?.(e.lngLat.lat, e.lngLat.lng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapInitialized(true);

      // Cleanup
      return () => {
        marker.remove();
        map.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      };
    } catch (error) {
      console.error('خطأ في تهيئة الخريطة:', error);
    }
  }, [mapboxToken, mapInitialized]);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && mapInitialized) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapInstanceRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 12,
      });
    }
  }, [latitude, longitude, mapInitialized]);

  return (
    <div className="space-y-4">
      {isLoadingToken && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>جاري تحميل الخريطة...</AlertDescription>
        </Alert>
      )}

      {tokenError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>
      )}

      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border"
        style={{ minHeight: '384px' }}
      >
        {!mapboxToken && !isLoadingToken && (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-2">خريطة Mapbox</p>
              <p className="text-sm text-muted-foreground">
                {tokenError || 'في انتظار تحميل رمز الخريطة...'}
              </p>
              {latitude && longitude && (
                <p className="text-xs text-muted-foreground mt-2">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {!readonly && mapboxToken && (
        <p className="text-sm text-muted-foreground">
          💡 انقر على الخريطة أو اسحب العلامة لتحديد الموقع
        </p>
      )}
    </div>
  );
}
