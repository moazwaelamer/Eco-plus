import { z } from 'zod';
import { paginationSchema } from '../common/pagination.js';

export const listShipmentsSchema = paginationSchema.extend({
  status: z.enum(['created', 'assigned', 'collected', 'weighed', 'rejected', 'cancelled']).optional(),
});

export type ListShipmentsDto = z.infer<typeof listShipmentsSchema>;
