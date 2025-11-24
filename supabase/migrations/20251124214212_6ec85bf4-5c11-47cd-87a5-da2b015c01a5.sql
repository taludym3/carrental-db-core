-- إضافة سياسة RLS للسماح للمستخدمين بقراءة أدوارهم الخاصة
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);