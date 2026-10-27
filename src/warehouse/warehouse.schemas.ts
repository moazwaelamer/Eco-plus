import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

export const listBatchesSchema = paginationSchema.extend({
  materialTypeId: z.coerce.number().int().positive().optional(),
  grade: z.string().trim().toUpperCase().max(10).optional(),
  status: z.enum(['in_stock', 'reserved', 'sold']).optional(),
});

export const stockQuerySchema = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
});

export const updateBatchSchema = z
  .object({
    grade: z.string().trim().toUpperCase().min(1).max(10).optional(),
    status: z.enum(['in_stock', 'reserved', 'sold']).optional(),
  })
  .refine((v) => v.grade !== undefined || v.status !== undefined, { message: 'Send a grade or a status' });

export type ListBatchesDto = z.infer<typeof listBatchesSchema>;
export type StockQueryDto = z.infer<typeof stockQuerySchema>;
export type UpdateBatchDto = z.infer<typeof updateBatchSchema>;
