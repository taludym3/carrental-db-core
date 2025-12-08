import { z } from 'zod';

// رسائل الخطأ بالعربية
const messages = {
  email: {
    required: 'البريد الإلكتروني مطلوب',
    invalid: 'البريد الإلكتروني غير صالح',
    max: 'البريد الإلكتروني طويل جداً'
  },
  password: {
    required: 'كلمة المرور مطلوبة',
    min: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    max: 'كلمة المرور طويلة جداً'
  }
};

// Schema تسجيل الدخول
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, messages.email.required)
    .email(messages.email.invalid)
    .max(255, messages.email.max)
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, messages.password.required)
    .min(6, messages.password.min)
    .max(128, messages.password.max)
});

export type LoginFormData = z.infer<typeof loginSchema>;
