-- Fix storage triggers - Remove broken triggers that use non-existent storage.delete_object function
-- The frontend code already handles image deletion correctly using supabase.storage.from().remove()

-- Drop brand logo cleanup trigger and function
DROP TRIGGER IF EXISTS cleanup_brand_logo_trigger ON car_brands;
DROP FUNCTION IF EXISTS cleanup_brand_logo();

-- Drop model image cleanup trigger and function
DROP TRIGGER IF EXISTS cleanup_model_image_trigger ON car_models;
DROP FUNCTION IF EXISTS cleanup_model_image();

-- Note: Image deletion is now handled entirely by the frontend code in:
-- - ImageUploader.tsx: Handles single image deletion for brands and models
-- - MultiImageUploader.tsx: Handles multiple image deletion for cars
-- This approach provides better error handling and user control