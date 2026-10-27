import { z } from 'zod';
import { latSchema, lngSchema } from '../common/geo.js';
import { UploadsService } from '../uploads/uploads.service.js';

export const createScanSchema = z
  .object({
    imageUrl: z
      .string()
      .refine((v) => UploadsService.isUploadUrl(v), 'Use the URL returned by POST /uploads/image')
      .optional(),
    // In Phase 1 the user picks the material by hand; the AI will fill this in during Phase 4.
    contentType: z.string().trim().toLowerCase().min(2).max(40),
    fillLevel: z.number().min(0).max(1).optional(),
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    message: 'Send both lat and lng, or neither',
    path: ['lat'],
  });

export type CreateScanDto = z.infer<typeof createScanSchema>;
