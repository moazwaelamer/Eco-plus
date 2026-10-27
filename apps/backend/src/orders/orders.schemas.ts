import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

/** Weights have at most 3 decimals, like the database column. */
const quantityKg = z
  .number()
  .positive()
  .max(1_000_000)
  .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, 'At most 3 decimals');

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        materialTypeId: z.number().int().positive(),
        /** Leave out to accept any grade. */
        grade: z.string().trim().min(1).max(20).optional(),
        quantityKg,
      }),
    )
    .min(1)
    .max(20),
});

export const listOrdersSchema = paginationSchema.extend({
  status: z.enum(['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled']).optional(),
  factoryId: z.coerce.number().int().positive().optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type ListOrdersDto = z.infer<typeof listOrdersSchema>;
