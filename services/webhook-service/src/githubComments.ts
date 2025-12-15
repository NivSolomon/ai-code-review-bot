import { octokit } from './github/octokit';
import { logger } from './utils/logger';
import { ReviewComment } from './types';

/**
 * Posts a single summary review comment on the PR.
 */
export async function postReviewSummary(params: {
  owner: string;
  repo: string;
  pullNumber: number;
  summary: string;
  comments: ReviewComment[];
}): Promise<void> {
  const { owner, repo, pullNumber, summary, comments } = params;

  // Build a nice markdown body
  const findings =
    comments.length === 0
      ? '_No specific issues were detected. Nice work!_'
      : comments
          .map(
            (c) =>
              `- (**${c.severity}**) \`${c.file}:${c.line}\` – ${c.message}`
          )
          .join('\n');

  const body = [
    '### 🤖 AI Code Review Assistant',
    '',
    summary,
    '',
    '#### Findings',
    findings,
  ].join('\n');

  logger.info('Posting AI review to GitHub', {
    owner,
    repo,
    pullNumber,
    commentCount: comments.length,
  });

  try {
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: 'COMMENT', // doesn't approve/request changes, just comments
      body,
    });

    logger.info('Successfully posted AI review to GitHub', {
      owner,
      repo,
      pullNumber,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Failed to post review summary to GitHub', {
      error: errorMessage,
      owner,
      repo,
      pullNumber,
    });
    throw new Error(
      `Failed to post review summary to PR #${pullNumber} in ${owner}/${repo}: ${errorMessage}`
    );
  }
}
