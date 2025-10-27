-- المرحلة 1: حذف الدوال التي تحتاج تحديث كامل
DROP FUNCTION IF EXISTS public.cleanup_expired_bookings();
DROP FUNCTION IF EXISTS public.search_cars(text,text,uuid[],uuid[],uuid[],uuid[],numeric,numeric,text,integer,integer,text[],text[],rental_type[],boolean,boolean,car_status[],numeric,numeric,numeric,text,integer,integer);
DROP FUNCTION IF EXISTS public.advanced_car_filter(DATE,DATE,BOOLEAN,DECIMAL,TEXT[],TEXT[],TEXT,DECIMAL,DECIMAL,UUID[],BOOLEAN,INTEGER,INTEGER);
DROP FUNCTION IF EXISTS public.get_nearest_cars(DECIMAL,DECIMAL,INTEGER);
DROP FUNCTION IF EXISTS public.reserve_car_atomic(uuid);
DROP FUNCTION IF EXISTS public.release_car_atomic(uuid);
DROP FUNCTION IF EXISTS public.adjust_car_availability_on_booking_change();
DROP FUNCTION IF EXISTS public.search_pdf_attachment(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.browse_pdf_attachment(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.refresh_cars_with_images();
DROP TRIGGER IF EXISTS trg_adjust_car_availability_on_booking_change ON public.bookings;
DROP INDEX IF EXISTS public.idx_profiles_role;