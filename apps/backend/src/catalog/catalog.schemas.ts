import { z } from 'zod';

export const createMaterialSchema = z.object({
  name: z.string().trim().min(2).max(80),
  pointFactor: z.number().positive().max(1000),
  pricePerKg: z.number().nonnegative().max(1_000_000),
  co2KgPerKg: z.number().nonnegative().max(1000).optional(),
});

export const updateMaterialSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    pointFactor: z.number().positive().max(1000),
    pricePerKg: z.number().nonnegative().max(1_000_000),
    co2KgPerKg: z.number().nonnegative().max(1000).nullable(),
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to change');

export type CreateMaterialDto = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialDto = z.infer<typeof updateMaterialSchema>;
