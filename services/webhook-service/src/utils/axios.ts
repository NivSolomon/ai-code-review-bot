import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from './logger';

// Create axios instance with retry logic
export const httpClient: AxiosInstance = axios.create({
  timeout: 30000, // 30 seconds default timeout
});

// Configure retry logic
axiosRetry(httpClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
  onRetry: (retryCount, error) => {
    logger.warn('Retrying request', {
      retryCount,
      maxRetries: 3,
      error: error.message,
    });
  },
});

