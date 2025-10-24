-- Create storage bucket for car model images
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-model-images', 'car-model-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow everyone to view model images
CREATE POLICY "Anyone can view model images"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-model-images');

-- RLS Policy: Allow admins to upload model images
CREATE POLICY "Admins can upload model images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- RLS Policy: Allow admins to update model images
CREATE POLICY "Admins can update model images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- RLS Policy: Allow admins to delete model images
CREATE POLICY "Admins can delete model images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'car-model-images' 
  AND auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create cleanup function for car model images
CREATE OR REPLACE FUNCTION cleanup_model_image()
RETURNS TRIGGER AS $$
DECLARE
  old_image_path text;
BEGIN
  -- Extract the file path from the full URL
  -- URL format: https://[project].supabase.co/storage/v1/object/public/car-model-images/[path]
  
  IF TG_OP = 'DELETE' THEN
    -- On delete, remove the image if it exists
    IF OLD.default_image_url IS NOT NULL THEN
      old_image_path := substring(OLD.default_image_url from 'car-model-images/(.+)$');
      IF old_image_path IS NOT NULL THEN
        PERFORM storage.delete_object('car-model-images', old_image_path);
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- On update, if default_image_url changed, delete the old one
    IF OLD.default_image_url IS DISTINCT FROM NEW.default_image_url AND OLD.default_image_url IS NOT NULL THEN
      old_image_path := substring(OLD.default_image_url from 'car-model-images/(.+)$');
      IF old_image_path IS NOT NULL THEN
        PERFORM storage.delete_object('car-model-images', old_image_path);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage;

-- Create trigger for automatic cleanup of model images
CREATE TRIGGER cleanup_model_image_trigger
AFTER UPDATE OR DELETE ON car_models
FOR EACH ROW
EXECUTE FUNCTION cleanup_model_image();