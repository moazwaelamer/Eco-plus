import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9]{8,15}$/, 'Use digits only, 8 to 15 long, optional leading +');

// bcrypt only uses the first 72 bytes, so longer passwords are refused instead of silently cut.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), 'Password needs at least one letter and one number');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: phone.optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    password,
    role: z.enum(['citizen', 'business']),
    businessName: z.string().trim().min(2).max(120).optional(),
    businessType: z.string().trim().min(2).max(60).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Provide a phone number or an email' });
    }
    if (v.role === 'business') {
      if (!v.businessName) ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Required for businesses' });
      if (!v.businessType) ctx.addIssue({ code: 'custom', path: ['businessType'], message: 'Required for businesses' });
    }
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(72),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
