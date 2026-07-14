## خطة إغلاق الثغرات مع الحفاظ على تطبيق Leago Mobile

التطبيق يعتمد على **Anonymous Auth** + مجموعة RPCs عامة، فلا يمكن سحب صلاحيات anon بالكامل. الخطة تفرّق بين **الدوال العامة للتطبيق** (تبقى) و**الدوال الإدارية** (تُقفل).

---

### 1) الدوال (117 × 2 = 234 finding)

**أ. قائمة بيضاء (تبقى EXECUTE لـ anon + authenticated):**
- Auth: `create_customer_profile_safe`, `check_user_exists`, `get_user_by_phone`, `verify_user_phone`, `check_user_is_customer`, `get_current_user_role`, `merge_guest_to_customer`
- بحث/عرض: `quick_search_suggestions`, `search_cars`, `advanced_car_filter`, `get_public_cars`, `get_active_announcements`
- حجز: `get_car_for_booking`, `get_user_booking_eligibility`, `calculate_booking_price_preview`, `check_car_availability`, `check_car_availability_detailed`, `validate_booking_dates`, `get_user_bookings`, `get_booking_full_details`, `get_user_booking_stats`, `customer_cancel_booking`, `create_booking_atomic`
- بروفايل/موقع: `update_user_profile`, `update_user_location`, `get_current_user_profile`
- إشعارات: `get_user_notifications`, `mark_notifications_read`

**ب. كل ما تبقى (دوال إدارة الفروع/السيارات/التقارير/المستخدمين/المدفوعات/الوثائق من طرف الأدمن):**
- `REVOKE EXECUTE ... FROM anon` (فقط anon، نبقي authenticated لأن الأدمن/الفرع مسجّلين).
- الحماية الفعلية داخل الدوال تعتمد على `has_role()` أصلاً، لكن سحب EXECUTE من anon يُغلق ~117 finding.

يقفل: **~117 finding** (فئة `anon_security_definer_function_executable`).
لا نمس فئة `authenticated_security_definer_function_executable` — تحتاج مراجعة منفصلة (كل دالة تستخدم `has_role` أو `auth.uid()` داخلياً).

---

### 2) سياسات RLS تسمح anon (26 finding)

مراجعة كل policy فيها `TO anon` أو `TO public`:
- **إبقاء anon SELECT** على: `cars`, `car_models`, `car_brands`, `car_colors`, `car_features`, `car_feature_assignments`, `branches`, `announcements`, `cars_with_details` — التطبيق يقرأها للزوار.
- **سحب anon** من: `bookings`, `payments`, `documents`, `profiles`, `user_roles`, `notifications`, `audit_log`, `security_audit_log`, `auth_logs`, `otp_requests`, `phone_verifications`, `rate_limits`, `deleted_users`, `notification_outbox`, `car_offers` (إن كانت خاصة).

يقفل: تقديرياً **15–20 finding** ويترك ~6 مبررة (بيانات عرض عامة).

---

### 3) Storage buckets عامة (5 finding)

- buckets الصور العامة (سيارات/فروع/إعلانات/براندز/موديلات): تبقى public read لأن التطبيق يعرضها للزوار.
- سحب صلاحية **LIST** فقط (إبقاء GET object) عبر policies، لمنع تعداد محتويات الـ bucket.
- bucket الوثائق (`documents` إن وُجد public) → يُحوَّل private كلياً.

يقفل: **5 finding**.

---

### 4) `extension_in_public` المتبقي

فحص أي extension لا يزال في `public` (غير `pg_trgm`/`btree_gist`) ونقله إلى schema `extensions`، مع استثناء `postgis` لأن نقله يكسر عمود `geom` في `branches`.

---

### النتيجة المتوقعة
من 267 → **~110 finding متبقٍ** (معظمها فئة `authenticated_security_definer_function_executable` تحتاج مراجعة دالة-دالة لاحقاً + `postgis`/`spatial_ref_sys` غير قابلة للإصلاح بدون امتيازات owner).

### تفاصيل تقنية
- كل التغييرات عبر migration واحدة SQL (REVOKE/GRANT/DROP POLICY/CREATE POLICY).
- لا تغييرات على كود التطبيق/الـ Edge Functions.
- بعد التنفيذ: تشغيل security scan جديد + تحديث `@security-memory` بالقائمة البيضاء لدوال anon حتى لا يعيد الفاحص رفعها.
