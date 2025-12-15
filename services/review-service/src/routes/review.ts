import { Router, Request, Response } from 'express';
import { ErrorCode, createErrorResponse, createSuccessResponse } from '../types';
import { generateCodeReview } from '../llmClient';
import { validateReviewRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

router.post('/', validateReviewRequest, async (req: Request, res: Response) => {
  const reviewRequest = req.body;
  
  logger.info('Received review request', {
    repo: reviewRequest.repo,
    prNumber: reviewRequest.prNumber,
    language: reviewRequest.language,
    diffLength: reviewRequest.diff.length,
    requestId: req.id,
  });

  try {
    // Call LLM to perform code review
    const reviewResponse = await generateCodeReview(
      reviewRequest.diff,
      reviewRequest.language
    );

    logger.info('Successfully generated code review', {
      repo: reviewRequest.repo,
      prNumber: reviewRequest.prNumber,
      commentCount: reviewResponse.comments.length,
      requestId: req.id,
    });

    res.status(200).json(
      createSuccessResponse(reviewResponse, req.id)
    );
  } catch (err) {
    logger.error('LLM error in /review', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      repo: reviewRequest.repo,
      prNumber: reviewRequest.prNumber,
      requestId: req.id,
    });

    res.status(500).json(
      createErrorResponse(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        'Failed to generate code review',
        undefined,
        req.id
      )
    );
  }
});

export default router;

