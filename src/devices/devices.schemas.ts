import { z } from 'zod';

export const registerDeviceSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(['android', 'ios', 'web']),
});

export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;
