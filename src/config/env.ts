import 'dotenv/config';
import { z } from 'zod';

/**
 * Central environment schema.
 *
 * Fields marked `.optional()` are not required to BOOT the app in Phase 1,
 * but will be validated strictly once the module that needs them
 * (payments, admin, etc.) is wired in a later phase. This keeps Phase 1
 * runnable without forcing you to already have payment/admin credentials.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  STORE_NAME: z.string().min(1).default('Noctra Store'),
  STORE_CURRENCY: z.string().min(1).default('IDR'),
  STORE_TIMEZONE: z.string().min(1).default('Asia/Jakarta'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi di .env'),

  WHATSAPP_TOKEN: z.string().min(1, 'WHATSAPP_TOKEN wajib diisi di .env'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, 'WHATSAPP_PHONE_NUMBER_ID wajib diisi di .env'),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1, 'WHATSAPP_VERIFY_TOKEN wajib diisi di .env'),
  WHATSAPP_API_VERSION: z.string().default('v20.0'),

  PAYMENT_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Intentionally NOT using the logger here — the logger itself may
    // depend on env being valid. Fail fast and loud, but never print
    // secret VALUES, only which keys are missing/invalid.
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n[CONFIG ERROR] Environment variables tidak valid:\n${issues}\n`);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
