import OpenAI from 'openai';
import { ReviewComment, ReviewResponse } from './types';
import { config } from './config';
import { logger } from './utils/logger';

// Re-export types for convenience
export type { ReviewComment, ReviewResponse };

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

const SYSTEM_PROMPT = `You are a senior code reviewer. Given a unified diff, return JSON code review suggestions with summary and comments.

You must respond ONLY with valid JSON matching this exact structure:
{
  "summary": "A brief summary of the code review",
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": 10,
      "severity": "info" | "warning" | "error",
      "message": "Your review comment here"
    }
  ]
}

Be constructive and helpful in your feedback. Focus on code quality, potential bugs, performance issues, and best practices.`;

export async function generateCodeReview(
  diff: string,
  language?: string
): Promise<ReviewResponse> {
  try {
    const userPrompt = language
      ? `Review this ${language} code diff:\n\n${diff}`
      : `Review this code diff:\n\n${diff}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Safely parse the JSON response
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response as JSON', {
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        contentLength: content.length,
        contentPreview: content.substring(0, 200),
      });
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Type guard and validation
    if (typeof parsedResponse !== 'object' || parsedResponse === null) {
      throw new Error('OpenAI response is not a valid object');
    }

    const response = parsedResponse as Partial<ReviewResponse>;

    // Sanity checks with fallbacks
    const summary = typeof response.summary === 'string' && response.summary.trim()
      ? response.summary.trim()
      : 'Code review completed';

    const comments = Array.isArray(response.comments)
      ? response.comments.filter((comment: unknown): comment is ReviewComment => {
          if (typeof comment !== 'object' || comment === null) {
            return false;
          }
          const c = comment as Record<string, unknown>;
          return (
            typeof c.file === 'string' &&
            typeof c.line === 'number' &&
            typeof c.severity === 'string' &&
            ['info', 'warning', 'error'].includes(c.severity) &&
            typeof c.message === 'string'
          );
        })
      : [];

    return {
      summary,
      comments,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      logger.error('OpenAI API Error', {
        status: error.status,
        message: error.message,
        code: error.code,
        diffLength: diff.length,
      });
      throw new Error(`OpenAI API error: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error('Error generating code review', {
        error: error.message,
        stack: error.stack,
        diffLength: diff.length,
      });
      throw error;
    } else {
      logger.error('Unexpected error generating code review', {
        error: String(error),
        diffLength: diff.length,
      });
      throw new Error('Unexpected error generating code review');
    }
  }
}
