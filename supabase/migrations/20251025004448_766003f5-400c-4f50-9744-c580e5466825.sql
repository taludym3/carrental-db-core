-- Migration 3: Add fields to branches table
-- إضافة حقول للفروع

ALTER TABLE branches 
  ADD COLUMN IF NOT EXISTS images TEXT[],
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;