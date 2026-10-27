import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

const phone = z.string().regex(/^\+?[0-9]{8,15}$/, 'Use digits only, 8 to 15 long, optional leading +');
const password = z
  .string()
  .min(8)
  .max(72)
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), 'Password needs at least one letter and one number');

export const createVehicleSchema = z.object({
  plate: z.string().trim().toUpperCase().min(3).max(20),
  type: z.string().trim().min(2).max(60),
  capacityKg: z.number().positive().max(100_000),
});

export const updateVehicleSchema = z
  .object({
    type: z.string().trim().min(2).max(60),
    capacityKg: z.number().positive().max(100_000),
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to change');

export const createDriverSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: phone.optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    password,
    licenseNo: z.string().trim().min(3).max(40),
  })
  .refine((v) => v.phone || v.email, { path: ['phone'], message: 'Provide a phone number or an email' });

export const updateDriverSchema = z
  .object({
    licenseNo: z.string().trim().min(3).max(40),
    status: z.enum(['available', 'off_duty']),
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to change');

export const listSchema = paginationSchema;

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type CreateDriverDto = z.infer<typeof createDriverSchema>;
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;
