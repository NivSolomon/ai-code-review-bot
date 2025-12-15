import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  port: number;
  openaiApiKey: string;
  maxDiffSize: number;
  maxRequestSize: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

// Validate required environment variables
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  );
}

export const config: Config = {
  port: parseInt(process.env.PORT || '4002', 10),
  openaiApiKey: requiredEnvVars.OPENAI_API_KEY!,
  maxDiffSize: parseInt(process.env.MAX_DIFF_SIZE || '1000000', 10), // 1MB default
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

