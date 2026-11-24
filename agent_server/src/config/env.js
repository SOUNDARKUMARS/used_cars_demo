import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load agent_server .env first, then parent site .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const rawOpenRouterKey =
  process.env.OPENROUTER_API_KEY ||
  process.env.LLM_API_KEY ||
  process.env.VITE_OPENROUTER_API_KEY ||
  '';

const rawSupabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const rawSupabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.string().default('development'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL must be provided in .env'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY must be provided in .env'),
  DATABASE_URL: z.string().optional().default(process.env.DATABASE_URL || ''),
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY must be provided in .env'),
  AGENT_MODEL: z.string().default(process.env.AGENT_MODEL || 'deepseek/deepseek-v4.1-flash'),
  MAX_TOKENS: z.coerce.number().default(Number(process.env.MAX_TOKENS || 350)),
  TEMPERATURE: z.coerce.number().default(Number(process.env.TEMPERATURE || 0.1)),
  OPENAI_API_KEY: z.string().optional().default(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''),
  INSTAGRAM_PAGE_ACCESS_TOKEN: z.string().optional().default(process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_USER_ACCESS_TOKEN || ''),
  INSTAGRAM_VERIFY_TOKEN: z.string().optional().default(process.env.INSTAGRAM_VERIFY_TOKEN || 'harsha_ig_verify_token_2026'),
  INSTAGRAM_APP_SECRET: z.string().optional().default(process.env.INSTAGRAM_APP_SECRET || '')
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: rawSupabaseUrl,
  SUPABASE_ANON_KEY: rawSupabaseKey,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENROUTER_API_KEY: rawOpenRouterKey,
  AGENT_MODEL: process.env.AGENT_MODEL,
  MAX_TOKENS: process.env.MAX_TOKENS,
  TEMPERATURE: process.env.TEMPERATURE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
  INSTAGRAM_PAGE_ACCESS_TOKEN: process.env.INSTAGRAM_PAGE_ACCESS_TOKEN || process.env.INSTAGRAM_USER_ACCESS_TOKEN,
  INSTAGRAM_VERIFY_TOKEN: process.env.INSTAGRAM_VERIFY_TOKEN,
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  throw new Error(`Environment validation failed: ${issues}`);
}

export const env = parsed.data;
export default env;
