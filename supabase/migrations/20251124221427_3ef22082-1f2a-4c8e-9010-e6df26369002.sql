-- 1. إنشاء function للتحقق من موظف الفرع
CREATE OR REPLACE FUNCTION public.is_branch_employee()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'branch_employee'
  );
$$;

-- 2. إضافة سياسة RLS جديدة للسماح لموظفي الفرع برؤية مستندات عملاء الحجوزات
CREATE POLICY "Branch staff can view customer documents for their bookings"
ON public.documents FOR SELECT
TO authenticated
USING (
  (is_branch_manager() OR is_branch_employee()) 
  AND user_id IN (
    SELECT DISTINCT b.customer_id 
    FROM public.bookings b
    WHERE b.branch_id = current_user_branch_id()
  )
);

-- 3. تحديث سياسات Storage للـ documents bucket
-- حذف السياسة القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Branch staff can read customer documents" ON storage.objects;

-- إضافة سياسة SELECT للسماح لموظفي الفرع بقراءة ملفات العملاء
CREATE POLICY "Branch staff can read customer documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    is_admin()
    OR 
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    ((storage.foldername(name))[1])::uuid IN (
      SELECT DISTINCT b.customer_id
      FROM public.bookings b
      WHERE b.branch_id = current_user_branch_id()
    )
  )
);