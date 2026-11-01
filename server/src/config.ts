import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)), '..');
dotenv.config({ path: resolve(rootDir, '.env') });

const requiredEnv = ['PORT', 'CLIENT_ORIGIN', 'MONGODB_URI', 'GEMINI_MODEL'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? '4100'),
  clientOrigin: clientOrigins[0] ?? 'http://localhost:5173',
  clientOrigins,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_mystery_room',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  caseTtlDays: Number(process.env.CASE_TTL_DAYS ?? '7'),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? '30')
};
