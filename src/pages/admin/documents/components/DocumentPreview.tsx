import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentPreviewProps {
  url: string;
  type: string;
}

export const DocumentPreview = ({ url, type }: DocumentPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPDF = url.toLowerCase().endsWith('.pdf');

  if (error) {
    return (
      <div className="w-full h-96 border rounded-lg flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">فشل تحميل المعاينة</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 border rounded-lg overflow-hidden">
      {loading && (
        <Skeleton className="absolute inset-0" />
      )}
      
      {isPDF ? (
        <iframe
          src={url}
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
          src={url}
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
