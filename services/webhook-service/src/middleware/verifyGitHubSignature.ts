import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ErrorCode, createErrorResponse } from '../types';

export function verifyGitHubSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if webhook secret is configured
  if (!config.githubWebhookSecret) {
    logger.warn('GITHUB_WEBHOOK_SECRET is not configured, skipping signature verification', {
      requestId: req.id,
    });
    return next();
  }

  // Check if raw body is available
  if (!req.rawBody) {
    logger.error('Missing rawBody in request - signature verification requires raw body buffer', {
      requestId: req.id,
    });
    res.status(401).json(
      createErrorResponse(
        ErrorCode.AUTHENTICATION_ERROR,
        'Missing request body for signature verification',
        undefined,
        req.id
      )
    );
    return;
  }

  // Get signature from header
  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    logger.error('Missing or invalid x-hub-signature-256 header', {
      requestId: req.id,
    });
    res.status(401).json(
      createErrorResponse(
        ErrorCode.AUTHENTICATION_ERROR,
        'Missing or invalid signature header',
        undefined,
        req.id
      )
    );
    return;
  }

  // Compute expected signature
  const expectedSignature = createHmac('sha256', config.githubWebhookSecret)
    .update(req.rawBody)
    .digest('hex');
  const expected = `sha256=${expectedSignature}`;

  logger.debug('Verifying GitHub webhook signature', {
    expectedPrefix: expected.substring(0, 20) + '...',
    receivedPrefix: signatureHeader.substring(0, 20) + '...',
    requestId: req.id,
  });

  // Compare signatures using timing-safe comparison
  // Convert strings to Buffers for timingSafeEqual
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

  // Check lengths first (timingSafeEqual requires same length)
  if (expectedBuffer.length !== receivedBuffer.length) {
    logger.error('Signature length mismatch', {
      expectedLength: expectedBuffer.length,
      receivedLength: receivedBuffer.length,
      requestId: req.id,
    });
    res.status(401).json(
      createErrorResponse(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid signature',
        undefined,
        req.id
      )
    );
    return;
  }

  // Perform timing-safe comparison
  const isValid = timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    logger.error('GitHub webhook signature verification failed', {
      requestId: req.id,
    });
    res.status(401).json(
      createErrorResponse(
        ErrorCode.AUTHENTICATION_ERROR,
        'Invalid signature',
        undefined,
        req.id
      )
    );
    return;
  }

  logger.debug('GitHub webhook signature verified successfully', {
    requestId: req.id,
  });
  next();
}


