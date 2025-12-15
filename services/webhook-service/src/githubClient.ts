import { octokit } from './github/octokit';
import { httpClient } from './utils/axios';
import { logger } from './utils/logger';

export async function fetchPullRequestDiff(params: {
  owner: string;
  repo: string;
  pullNumber: number;
}): Promise<string> {
  try {
    logger.info('Fetching PR info', { ...params });

    // Get PR info
    const { data: prData } = await octokit.rest.pulls.get({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
    });

    const diffUrl = prData.diff_url;

    if (!diffUrl) {
      throw new Error(`No diff_url found for PR #${params.pullNumber} in ${params.owner}/${params.repo}`);
    }

    logger.info('Fetching diff from GitHub', { diffUrl, pullNumber: params.pullNumber });

    // Fetch the diff from the URL with timeout
    const response = await httpClient.get(diffUrl, {
      headers: {
        Accept: 'application/vnd.github.v3.diff',
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      responseType: 'text',
      timeout: 10000, // 10 seconds for diff fetch
    });

    if (typeof response.data !== 'string') {
      throw new Error('Invalid diff response format');
    }

    logger.info('Successfully fetched diff', {
      pullNumber: params.pullNumber,
      diffLength: response.data.length,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to fetch PR diff', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ...params,
    });

    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch diff for PR #${params.pullNumber} in ${params.owner}/${params.repo}: ${error.message}`
      );
    } else {
      throw new Error(
        `Unexpected error fetching PR diff for PR #${params.pullNumber} in ${params.owner}/${params.repo}`
      );
    }
  }
}

