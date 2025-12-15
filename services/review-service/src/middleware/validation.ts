import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorCode, createErrorResponse } from '../types';
import { config } from '../config';

const ReviewRequestSchema = z.object({
  repo: z.string().min(1, 'Repository name is required'),
  prNumber: z.number().int().positive('PR number must be a positive integer'),
  diff: z
    .string()
    .min(1, 'Diff is required')
    .max(config.maxDiffSize, `Diff exceeds maximum size of ${config.maxDiffSize} characters`),
  language: z.string().optional(),
});

export function validateReviewRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const validationResult = ReviewRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    res.status(400).json(
      createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid request body',
        { errors },
        req.id
      )
    );
    return;
  }

  // Replace req.body with validated data
  req.body = validationResult.data;
  next();
}

