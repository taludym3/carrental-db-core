import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageDeleted?: () => void;
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export const ImageUploader = ({
  currentImageUrl,
  onImageUploaded,
  onImageDeleted,
  bucket,
  folder = '',
  maxSizeMB = 2,
  disabled = false,
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار صورة فقط',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: 'خطأ',
        description: `حجم الصورة يجب أن يكون أقل من ${maxSizeMB} ميجابايت`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Delete old image if exists
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split(`${bucket}/`)[1];
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onImageUploaded(publicUrl);

      toast({
        title: 'تم الرفع بنجاح',
        description: 'تم رفع الصورة بنجاح',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'خطأ في الرفع',
        description: error.message || 'حدث خطأ أثناء رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;

    setDeleting(true);

    try {
      const filePath = currentImageUrl.split(`${bucket}/`)[1];
      
      if (filePath) {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) throw error;
      }

      setPreview(null);
      onImageDeleted?.();

      toast({
        title: 'تم الحذف',
        description: 'تم حذف الصورة بنجاح',
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء حذف الصورة',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {preview ? (
        <div className="relative w-full max-w-md">
          <div className="relative w-full h-48 border-2 rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload className="w-4 h-4 ml-2" />
              تغيير الصورة
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={disabled || deleting}
            >
              <X className="w-4 h-4 ml-2" />
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className="w-full max-w-md h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors bg-muted/50"
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">جاري الرفع...</p>
            </>
          ) : (
            <>
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center px-4">
                اسحب الصورة هنا أو انقر للاختيار
              </p>
              <p className="text-xs text-muted-foreground">
                الحد الأقصى: {maxSizeMB} ميجابايت
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
