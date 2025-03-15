import { GithubContext } from './types.js';

export async function handleSecurityWorkflowTrigger(context: GithubContext) {
  const { owner, repo } = context.repo();
  const ref = context.payload.pull_request.head.ref;

  try {
    await context.octokit.issues.createComment({
      ...context.repo(),
      issue_number: context.payload.pull_request.number,
      body: 'Running security check'
    });
    
    await context.octokit.actions.createWorkflowDispatch({
      owner, 
      repo, 
      workflow_id: 'security.yaml', 
      ref
    });
  } catch (error: unknown) {
    const errorObj = error as { status?: number };
    if (errorObj.status === 404) {
      await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: context.payload.pull_request.number,
        body: 'Failed to run security check'
      });
      return;
    }
    throw error;
  }
}
  