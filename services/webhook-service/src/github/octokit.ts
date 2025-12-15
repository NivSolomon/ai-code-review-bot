import { Octokit } from '@octokit/rest';
import { config } from '../config';

// Shared Octokit instance for all GitHub API calls
export const octokit = new Octokit({
  auth: config.githubToken,
});

