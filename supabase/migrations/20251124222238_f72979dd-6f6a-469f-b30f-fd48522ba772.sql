-- Add 'new_booking' value to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_booking';