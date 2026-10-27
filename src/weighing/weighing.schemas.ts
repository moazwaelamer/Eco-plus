import { z } from 'zod';

const weight = z
  .number()
  .positive('Weight must be more than zero')
  .max(100_000, 'Weight is too large')
  .refine((v) => Math.round(v * 1000) / 1000 === v, 'Use at most 3 decimal places');

export const weighSchema = z
  .object({
    materialTypeId: z.number().int().positive().optional(),
    actualWeightKg: weight,
    grade: z.string().trim().toUpperCase().min(1).max(10).optional(),
    accepted: z.boolean(),
    rejectReason: z.string().trim().min(3).max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.accepted && v.materialTypeId === undefined) {
      ctx.addIssue({ code: 'custom', path: ['materialTypeId'], message: 'Choose the material when accepting' });
    }
    if (!v.accepted && !v.rejectReason) {
      ctx.addIssue({ code: 'custom', path: ['rejectReason'], message: 'Give a reason when rejecting' });
    }
  });

export type WeighDto = z.infer<typeof weighSchema>;
