-- حذف النسخة القديمة من advanced_car_filter التي تستخدم p_feature_ids UUID[]
DROP FUNCTION IF EXISTS public.advanced_car_filter(UUID[], UUID[], UUID[], UUID[], UUID[], NUMERIC, NUMERIC, INT, INT, TEXT[], TEXT[], INT, INT, TEXT[], BOOLEAN, BOOLEAN, DATE, DATE, TEXT, INT, INT);

-- التأكد من وجود النسخة الصحيحة فقط (التي تستخدم p_feature_names TEXT[])
COMMENT ON FUNCTION public.advanced_car_filter(UUID[], UUID[], UUID[], UUID[], TEXT[], NUMERIC, NUMERIC, INT, INT, TEXT[], TEXT[], INT, INT, TEXT[], BOOLEAN, BOOLEAN, DATE, DATE, TEXT, INT, INT) IS 'فلتر متقدم للسيارات - النسخة النهائية المحدثة';