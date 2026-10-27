import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9]{8,15}$/, 'Use digits only, 8 to 15 long, optional leading +');

export const createFactorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
});

export const updateFactorySchema = createFactorySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to change');

export const createFactoryUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: phone.optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    password: z
      .string()
      .min(8)
      .max(72)
      .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), 'Password needs at least one letter and one number'),
  })
  .refine((v) => v.phone || v.email, { path: ['phone'], message: 'Provide a phone number or an email' });

export type CreateFactoryDto = z.infer<typeof createFactorySchema>;
export type UpdateFactoryDto = z.infer<typeof updateFactorySchema>;
export type CreateFactoryUserDto = z.infer<typeof createFactoryUserSchema>;
