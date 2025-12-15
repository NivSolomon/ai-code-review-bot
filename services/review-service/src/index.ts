import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import reviewRouter from './routes/review';
import { requestIdMiddleware } from './middleware/requestId';
import { reviewRateLimiter } from './middleware/rateLimiter';
import { config } from './config';
import { logger } from './utils/logger';
import { openai } from './llmClient';

export function createServer(): Express {
  const app = express();

  // Trust proxy for rate limiting (if behind a reverse proxy)
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

  // Request ID middleware (must be first)
  app.use(requestIdMiddleware);

  // Middleware with size limit
  app.use(express.json({ limit: config.maxRequestSize }));

  // Health check endpoint with dependency checks
  app.get('/health', async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {
      service: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime()}s`,
    };

    // Check OpenAI connection (simple validation)
    try {
      // Just verify the client is initialized
      checks.openai = openai ? 'ok' : 'error';
    } catch (error) {
      checks.openai = 'error';
    }

    const isHealthy = checks.service === 'ok' && checks.openai === 'ok';
    res.status(isHealthy ? 200 : 503).json(checks);
  });

  // Apply rate limiting to review routes
  app.use('/review', reviewRateLimiter);

  // Mount review router
  app.use('/review', reviewRouter);

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, _next: unknown) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        requestId: req.id,
      },
    });
  });

  return app;
}

// Start server if this file is run directly
if (require.main === module) {
  logger.info('Review service starting', {
    hasOpenAIApiKey: !!config.openaiApiKey,
    port: config.port,
  });

  const app = createServer();
  const server = app.listen(config.port, () => {
    logger.info('Review service started', { port: config.port });
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
