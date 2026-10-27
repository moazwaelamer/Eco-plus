import { z } from 'zod';
import { latSchema, lngSchema } from '../common/geo.js';

export const staffRequestSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Use digits only, 8 to 15 long, optional leading +'),
  }),
  contentType: z.string().trim().toLowerCase().min(2).max(40),
  fillLevel: z.number().min(0).max(1),
  lat: latSchema,
  lng: lngSchema,
  channel: z.enum(['phone', 'whatsapp']),
});

export type StaffRequestDto = z.infer<typeof staffRequestSchema>;
