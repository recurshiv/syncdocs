import 'dotenv/config'
import { z } from 'zod'

// Validate environment variables once at startup. A missing or malformed
// value fails fast here instead of causing a confusing error later.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
