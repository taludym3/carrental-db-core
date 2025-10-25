-- Migration 2: Restructure cars table
-- تعديل جدول السيارات

-- إضافة حقول جديدة للسيارات
ALTER TABLE cars 
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS additional_images TEXT[];

-- نقل البيانات من branch_images إلى additional_images (إن وجدت)
UPDATE cars SET additional_images = branch_images WHERE branch_images IS NOT NULL;

-- حذف الحقول القديمة الخاصة بالفرع (يجب أن تكون في جدول الفروع)
ALTER TABLE cars 
  DROP COLUMN IF EXISTS branch_images,
  DROP COLUMN IF EXISTS branch_description_ar,
  DROP COLUMN IF EXISTS branch_description_en;