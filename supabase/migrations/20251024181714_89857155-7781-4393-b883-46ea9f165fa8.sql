-- Create function to cleanup old brand logos from storage
CREATE OR REPLACE FUNCTION cleanup_brand_logo()
RETURNS TRIGGER AS $$
DECLARE
  old_logo_path text;
  new_logo_path text;
BEGIN
  -- Extract the file path from the full URL
  -- URL format: https://[project].supabase.co/storage/v1/object/public/brand-logos/[path]
  
  IF TG_OP = 'DELETE' THEN
    -- On delete, remove the logo if it exists
    IF OLD.logo_url IS NOT NULL THEN
      old_logo_path := substring(OLD.logo_url from 'brand-logos/(.+)$');
      IF old_logo_path IS NOT NULL THEN
        PERFORM storage.delete_object('brand-logos', old_logo_path);
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- On update, if logo_url changed, delete the old one
    IF OLD.logo_url IS DISTINCT FROM NEW.logo_url AND OLD.logo_url IS NOT NULL THEN
      old_logo_path := substring(OLD.logo_url from 'brand-logos/(.+)$');
      IF old_logo_path IS NOT NULL THEN
        PERFORM storage.delete_object('brand-logos', old_logo_path);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for brand logo cleanup
CREATE TRIGGER cleanup_brand_logo_trigger
  AFTER UPDATE OR DELETE ON car_brands
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_brand_logo();