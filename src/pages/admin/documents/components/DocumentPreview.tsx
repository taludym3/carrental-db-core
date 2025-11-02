import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface DocumentPreviewProps {
  url: string;
  type: string;
}

export const DocumentPreview = ({ url, type }: DocumentPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(url, 3600); // Valid for 1 hour

        if (error) throw error;
        if (data) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError(true);
        setLoading(false);
      }
    };

    if (url) {
      getSignedUrl();
    }
  }, [url]);

  const isPDF = url.toLowerCase().endsWith('.pdf');

  if (error) {
    return (
      <div className="w-full h-96 border rounded-lg flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">فشل تحميل المعاينة</p>
      </div>
    );
  }

  if (!signedUrl && loading && !error) {
    return (
      <div className="w-full h-96 border rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 border rounded-lg overflow-hidden">
      {loading && !error && (
        <Skeleton className="absolute inset-0" />
      )}
      
      {isPDF ? (
        <iframe
          src={signedUrl}
          className="w-full h-full"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          title="Document Preview"
        />
      ) : (
        <img
          src={signedUrl}
          alt="Document"
          className="w-full h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};
