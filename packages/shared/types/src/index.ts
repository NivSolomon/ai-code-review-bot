// Shared types for AI Code Review Assistant

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    name: string;
    full_name: string;
    html_url: string;
  };
  pull_request?: {
    number: number;
    title: string;
    body: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
  };
  [key: string]: unknown;
}

export interface ReviewRequest {
  repo: string;
  prNumber: number;
  diff: string;         // unified diff
  language?: string;    // optional, like 'typescript'
}

export interface ReviewResponse {
  summary: string;
  comments: Array<{
    file: string;
    line: number;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

// Legacy interfaces (kept for backward compatibility if needed)
export interface ReviewFile {
  path: string;
  content: string;
  language: string;
}

export interface ReviewComment {
  file: string;
  line: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// Re-export error types
export * from './errors';

