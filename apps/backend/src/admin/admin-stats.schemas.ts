import { z } from 'zod';

export const statsQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(90).default(30) });
export type StatsQueryDto = z.infer<typeof statsQuerySchema>;
