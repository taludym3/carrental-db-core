import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MultiImageUploaderProps {
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
  bucket: string;
  folder: string;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

export const MultiImageUploader = ({
  currentImages,
  onImagesChange,
  bucket,
  folder,
  maxImages = 10,
  maxSizeMB = 5,
  disabled = false,
}: MultiImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast.error(`يمكنك رفع ${maxImages} صور كحد أقصى`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} ليس ملف صورة`);
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
          throw new Error(`${file.name} أكبر من ${maxSizeMB}MB`);
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        return fileName;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      onImagesChange([...currentImages, ...uploadedPaths]);
      toast.success(`تم رفع ${uploadedPaths.length} صورة`);
    } catch (error: any) {
      toast.error(error.message || "خطأ في الرفع");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (index: number) => {
    const imagePath = currentImages[index];
    setDeletingIndex(index);

    try {
      const { error } = await supabase.storage.from(bucket).remove([imagePath]);
      if (error) throw error;

      const newImages = currentImages.filter((_, i) => i !== index);
      onImagesChange(newImages);
      toast.success("تم حذف الصورة بنجاح");
    } catch (error: any) {
      toast.error(error.message || "خطأ في الحذف");
    } finally {
      setDeletingIndex(null);
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {currentImages.length < maxImages && (
        <div>
          <input
            type="file"
            id="multi-image-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
          />
          <label htmlFor="multi-image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || uploading}
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    رفع صور ({currentImages.length}/{maxImages})
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="text-sm text-muted-foreground mt-2">
            الحد الأقصى: {maxImages} صور، كل صورة حتى {maxSizeMB}MB
          </p>
        </div>
      )}

      {/* Images Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imagePath, index) => (
            <div key={index} className="relative group">
              <img
                src={getImageUrl(imagePath)}
                alt={`صورة ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(index)}
                disabled={deletingIndex === index}
              >
                {deletingIndex === index ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
