/**
 * Type definitions for the review service
 */

export type Severity = 'info' | 'warning' | 'error';

export interface ReviewComment {
  file: string;
  line: number;
  severity: Severity;
  message: string;
}

export interface ReviewRequest {
  repo: string;
  prNumber: number;
  diff: string;         // unified diff
  language?: string;    // optional, like 'typescript'
}

export interface ReviewResponse {
  summary: string;
  comments: ReviewComment[];
}

// Error response types
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  requestId?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    requestId,
  };
}

