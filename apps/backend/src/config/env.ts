import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().default(''),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
  // Decision rule v1: a bag is worth a trip when its fill level reaches the threshold.
  READY_FILL_THRESHOLD: z.coerce.number().min(0).max(1).default(0.6),
  BUSINESS_READY_FILL_THRESHOLD: z.coerce.number().min(0).max(1).default(0.4),
  // Decision rule v2: a bag below the threshold is still collected when another open shipment is
  // within this many metres and the bag is at least MERGE_MIN_FILL full (the trip happens anyway).
  MERGE_RADIUS_M: z.coerce.number().positive().default(150),
  MERGE_MIN_FILL: z.coerce.number().min(0).max(1).default(0.3),
  // Optional. When set, stop order comes from Google Routes API; otherwise (or on failure) nearest-neighbour.
  GOOGLE_ROUTES_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  // Time zone that decides what "today" means for a driver.
  APP_TIMEZONE: z.string().default('Africa/Cairo'),
  // "none" sends nothing, "log" only logs how many phones would get the push. A real FCM sender is not built yet.
  PUSH_PROVIDER: z.enum(['none', 'log']).default('none'),
  // Days between delivery and the invoice due date.
  INVOICE_DUE_DAYS: z.coerce.number().int().positive().default(30),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(5),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

/** Validates process.env at startup and fails fast with a readable list of problems. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}
