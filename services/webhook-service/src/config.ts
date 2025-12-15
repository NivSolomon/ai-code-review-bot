import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  port: number;
  reviewServiceUrl: string;
  githubToken: string;
  githubWebhookSecret?: string;
  maxRequestSize: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

// Validate required environment variables
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  throw new Error('GITHUB_TOKEN environment variable is required');
}

export const config: Config = {
  port: parseInt(process.env.PORT || '4001', 10),
  reviewServiceUrl: process.env.REVIEW_SERVICE_URL || 'http://localhost:4002',
  githubToken,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

