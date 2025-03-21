import { App, GithubContext, Comment } from './types.js';

export function formatComment(comment: Comment): string {
  return `
Comment by ${comment.user} (${comment.created_at}):
${comment.body}
---
`;
}

// Error handler
export async function handleError(
  context: GithubContext, 
  app: App, 
  error: Error | unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  app.log.error('Error processing PR:', error);
  
  try {
    const commentParams = {
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: `## Error Processing PR
An error occurred while analyzing this PR:
\`\`\`
${errorMessage}
\`\`\`
Please check the application logs for more details.`
    };
    
    await context.octokit.issues.createComment(commentParams);
  } catch (commentError) {
    app.log.error('Failed to post error comment:', commentError);
  }
}

/**
 * Utility function to log errors with full stack traces
 * @param message Custom error message
 * @param error The error object
 */
export function logError(message: string, error: unknown): void {
  console.error(message);
  
  if (error instanceof Error) {
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    // If it's our custom AppError with a cause, log the cause stack too
    if ('cause' in error && error.cause instanceof Error) {
      console.error('Caused by:', error.cause);
      console.error('Cause stack trace:', error.cause.stack);
    }
    
    // If our custom AppError has getFullStack method, use it
    if ('getFullStack' in error && typeof (error as any).getFullStack === 'function') {
      console.error('Full stack trace:', (error as any).getFullStack());
    }
  } else {
    console.error('Unknown error type:', error);
  }
}
