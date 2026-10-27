import { z } from 'zod';

export const createRequestSchema = z.object({
  scanId: z.number().int().positive(),
});

export type CreateRequestDto = z.infer<typeof createRequestSchema>;
