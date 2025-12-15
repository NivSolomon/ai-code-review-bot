import { Router, Request, Response } from 'express';
import { GitHubWebhookPayload, ReviewComment, ErrorCode, createErrorResponse, createSuccessResponse } from '../types';
import { config } from '../config';
import { fetchPullRequestDiff } from '../githubClient';
import { verifyGitHubSignature } from '../middleware/verifyGitHubSignature';
import { postReviewSummary } from '../githubComments';
import { httpClient } from '../utils/axios';
import { logger } from '../utils/logger';

const router = Router();

router.post('/webhook', verifyGitHubSignature, async (req: Request, res: Response) => {
  const eventType = req.headers['x-github-event'];
  const body: GitHubWebhookPayload = req.body;
  
  logger.info('GitHub webhook received', {
    eventType,
    action: body.action,
    requestId: req.id,
  });

  try {
    // Check if it's a pull_request event with action 'opened', 'reopened', or 'synchronize'
    if (eventType === 'pull_request' && body.action && ['opened', 'reopened', 'synchronize'].includes(body.action)) {
      const fullName = body.repository?.full_name;
      const pullNumber = body.pull_request?.number;

      if (!fullName || !pullNumber) {
        logger.warn('Missing repo full_name or PR number in webhook payload', {
          requestId: req.id,
        });
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Missing repo full_name or PR number',
            undefined,
            req.id
          )
        );
      }

      // Split repository.full_name into owner and repo
      const [owner, repo] = fullName.split('/');
      if (!owner || !repo) {
        logger.warn('Invalid repository full_name format', {
          fullName,
          requestId: req.id,
        });
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'Invalid repository full_name format',
            { fullName },
            req.id
          )
        );
      }

      logger.info('Processing PR', {
        pullNumber,
        fullName,
        owner,
        repo,
        requestId: req.id,
      });

      // Fetch the real diff from GitHub
      const diff = await fetchPullRequestDiff({
        owner,
        repo,
        pullNumber,
      });

      logger.info('Fetched diff from GitHub', {
        pullNumber,
        diffLength: diff.length,
        requestId: req.id,
      });

      // Handle empty diffs (PRs with no changes)
      if (!diff || diff.trim().length === 0) {
        logger.info('Skipping review for PR with empty diff', {
          pullNumber,
          owner,
          repo,
          requestId: req.id,
        });
        return res.status(200).json(
          createSuccessResponse(
            {
              forwardedToReviewService: false,
              postedReviewToGitHub: false,
              reason: 'PR has no changes to review',
            },
            req.id
          )
        );
      }

      // Build request body for review service
      const reviewRequestBody = {
        repo: fullName,
        prNumber: pullNumber,
        diff,
        language: 'typescript' as const,
      };

      // Send HTTP POST to review-service with timeout
      logger.info('Sending request to review service', {
        pullNumber,
        requestId: req.id,
      });

      logger.info('Review service URL', { url: config.reviewServiceUrl, requestId: req.id });
      logger.info('Posting to review endpoint', { url: `${config.reviewServiceUrl}/review`, requestId: req.id });

      const reviewServiceResponse = await httpClient.post(
        `${config.reviewServiceUrl}/review`,
        reviewRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 60 seconds for LLM processing
        }
      );

      logger.info('Received review from review service', {
        pullNumber,
        commentCount: reviewServiceResponse.data.data?.comments?.length || 0,
        requestId: req.id,
      });

      // Extract summary and comments from review response
      const reviewData = reviewServiceResponse.data.data || reviewServiceResponse.data;
      const { summary, comments } = reviewData;

      if (!summary || !Array.isArray(comments)) {
        logger.error('Invalid review response format', {
          pullNumber,
          requestId: req.id,
        });
        return res.status(500).json(
          createErrorResponse(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            'Invalid response format from review service',
            undefined,
            req.id
          )
        );
      }

      // Post review summary to GitHub
      try {
        await postReviewSummary({
          owner,
          repo,
          pullNumber,
          summary,
          comments: comments as ReviewComment[],
        });

        logger.info('Successfully posted review to GitHub', {
          pullNumber,
          owner,
          repo,
          requestId: req.id,
        });

        return res.status(200).json(
          createSuccessResponse(
            {
              forwardedToReviewService: true,
              postedReviewToGitHub: true,
            },
            req.id
          )
        );
      } catch (postError) {
        logger.error('Failed to post review to GitHub', {
          error: postError instanceof Error ? postError.message : 'Unknown error',
          stack: postError instanceof Error ? postError.stack : undefined,
          pullNumber,
          requestId: req.id,
        });
        return res.status(500).json(
          createErrorResponse(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Failed to post review to GitHub: ${postError instanceof Error ? postError.message : 'Unknown error'}`,
            undefined,
            req.id
          )
        );
      }
    } else {
      // Not a relevant pull_request event
      logger.info('Ignoring webhook event', {
        eventType,
        action: body.action,
        requestId: req.id,
      });
      return res.status(200).json(
        createSuccessResponse({ ignored: true }, req.id)
      );
    }
  } catch (error: unknown) {
    logger.error('Error processing webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestId: req.id,
    });
    
    if (error instanceof Error) {
      const isTimeout = error.message.includes('timeout') || error.message.includes('TIMEOUT');
      return res.status(500).json(
        createErrorResponse(
          isTimeout ? ErrorCode.TIMEOUT_ERROR : ErrorCode.INTERNAL_ERROR,
          `Failed to process webhook: ${error.message}`,
          undefined,
          req.id
        )
      );
    } else {
      return res.status(500).json(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Failed to process webhook: Unknown error',
          undefined,
          req.id
        )
      );
    }
  }
});

export default router;

