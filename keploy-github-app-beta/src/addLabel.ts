import { GithubContext } from '../types.js';

interface LabelOptions {
    name: string;
    color: string;
    description: string;
}

export const LABEL_CONFIGS: Record<string, LabelOptions> = {
    'LGTM': {
        name: 'LGTM',
        color: '0e8a16',
        description: 'Changes look good to merge'
    },
    'Needs Changes': {
        name: 'Needs Changes',
        color: 'd93f0b',
        description: 'Changes requested by automated review'
    },
    'Spam': {
        name: 'Spam',
        color: 'b60205',
        description: 'Potentially spam or irrelevant changes'
    }
};

export async function determineLabelFromAnalysis(llmResponse: string): Promise<string> {
    const lowerResponse = llmResponse.toLowerCase();
    
    if (lowerResponse.includes('lgtm!')) {
        return 'LGTM';
    } else if (lowerResponse.includes('spam') || 
              (lowerResponse.length < 10 && !isValidShortResponse(lowerResponse))) {
        return 'Spam';
    } else {
        return 'Needs Changes';
    }
}

// Helper function to identify valid short responses
function isValidShortResponse(response: string): boolean {
    const validShortResponses = [
        'ok', 'yes', 'no', 'good', 'fine', 'nice', 'approved', '+1'
    ];
    return validShortResponses.some(valid => response.includes(valid));
}

/**
 * Utility function to log errors with full stack traces
 * @param message Custom error message
 * @param error The error object
 */
function logError(message: string, error: unknown): void {
  console.error(message);
  
  if (error instanceof Error) {
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    // If it's an error with a cause, log the cause stack too
    if ('cause' in error && error.cause instanceof Error) {
      console.error('Caused by:', error.cause);
      console.error('Cause stack trace:', error.cause.stack);
    }
  } else {
    console.error('Unknown error type:', error);
  }
}

export async function addLabelToPR(
    context: GithubContext,
    prNumber: number,
    labelName: string
): Promise<boolean> {
    try {
        // Remove existing review labels first
        const existingLabels = Object.keys(LABEL_CONFIGS);
        
        // Remove labels in parallel with Promise.all
        await Promise.all(
            existingLabels.map(label => 
                context.octokit.issues.removeLabel({
                    ...context.repo(),
                    issue_number: prNumber,
                    name: label
                }).catch(() => {/* Ignore errors if labels don't exist */})
            )
        );

        // Add new label
        await context.octokit.issues.addLabels({
            ...context.repo(),
            issue_number: prNumber,
            labels: [labelName]
        });

        return true;
    } catch (error) {
        logError('Error adding label:', error);
        return false;
    }
}
