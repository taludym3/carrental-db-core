-- إزالة القيود القديمة
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_model_id_fkey;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_color_id_fkey;

-- إعادة إنشاء القيد لـ model_id مع CASCADE
-- عند حذف موديل، سيتم حذف جميع السيارات المرتبطة به
ALTER TABLE cars 
  ADD CONSTRAINT cars_model_id_fkey 
  FOREIGN KEY (model_id) 
  REFERENCES car_models(id) 
  ON DELETE CASCADE;

-- إعادة إنشاء القيد لـ color_id مع SET NULL
-- عند حذف لون، سيتم تعيين color_id إلى NULL في السيارات
-- نحتاج أولاً جعل الحقل nullable
ALTER TABLE cars ALTER COLUMN color_id DROP NOT NULL;

ALTER TABLE cars 
  ADD CONSTRAINT cars_color_id_fkey 
  FOREIGN KEY (color_id) 
  REFERENCES car_colors(id) 
  ON DELETE SET NULL;