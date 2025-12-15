import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { config } from '../config';
import { ErrorCode, createErrorResponse } from '../types';

export const webhookRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: (req: Request) => {
    return createErrorResponse(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests, please try again later',
      undefined,
      req.id
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip X-Forwarded-For validation if not behind a proxy
  validate: {
    xForwardedForHeader: false,
  },
});

