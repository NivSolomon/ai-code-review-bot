import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import githubWebhookRouter from './routes/githubWebhook';
import { requestIdMiddleware } from './middleware/requestId';
import { webhookRateLimiter } from './middleware/rateLimiter';
import { config } from './config';
import { logger } from './utils/logger';

export function createServer(): Express {
  const app = express();

  // Trust proxy for rate limiting (if behind a reverse proxy)
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

  // Request ID middleware (must be first)
  app.use(requestIdMiddleware);

  // Middleware with custom verify function for GitHub webhook signature validation
  app.use(
    express.json({
      limit: config.maxRequestSize,
      verify: (req: Request, _res: Response, buf: Buffer) => {
        // Save raw body buffer for GitHub webhook routes
        if (req.originalUrl?.startsWith('/github/')) {
          req.rawBody = buf;
        }
      },
    })
  );

  // Health check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    const health = {
      status: 'ok',
      service: 'webhook-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    res.json(health);
  });

  // Apply rate limiting to webhook routes
  app.use('/github', webhookRateLimiter);

  // Mount GitHub webhook router
  app.use('/github', githubWebhookRouter);

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
  const app = createServer();
  const PORT = config.port;

  const server = app.listen(PORT, () => {
    logger.info('Webhook service started', { port: PORT });
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
