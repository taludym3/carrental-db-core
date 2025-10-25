-- Migration 1: Create car_features table
-- إنشاء جدول المميزات

CREATE TABLE IF NOT EXISTS car_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إضافة RLS policies
ALTER TABLE car_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active features"
ON car_features FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage features"
ON car_features FOR ALL
USING (is_admin());

-- إضافة بيانات أولية
INSERT INTO car_features (name_ar, name_en) VALUES
  ('نظام ملاحة GPS', 'GPS Navigation System'),
  ('كاميرا خلفية', 'Rear Camera'),
  ('مقاعد جلدية', 'Leather Seats'),
  ('فتحة سقف', 'Sunroof'),
  ('نظام ABS', 'ABS System'),
  ('وسائد هوائية', 'Airbags'),
  ('نظام تحكم بالمناخ', 'Climate Control'),
  ('بلوتوث', 'Bluetooth'),
  ('منافذ USB', 'USB Ports'),
  ('شاشة لمس', 'Touch Screen'),
  ('مثبت سرعة', 'Cruise Control'),
  ('حساسات ركن', 'Parking Sensors'),
  ('تحكم صوتي', 'Voice Control'),
  ('إضاءة LED', 'LED Lights'),
  ('نظام صوتي متطور', 'Premium Sound System');