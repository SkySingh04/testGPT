import { GithubContext } from './types.js';

export async function handleLintWorkflowTrigger(context: GithubContext) {
  const { owner, repo } = context.repo();
  const ref = context.payload.pull_request.head.ref;

  try {    
    await context.octokit.actions.createWorkflowDispatch({
      owner, 
      repo, 
      workflow_id: 'lint.yaml', 
      ref
    });
  } catch (error: unknown) {
    const errorObj = error as { status?: number };
    if (errorObj.status === 404) {
      await context.octokit.issues.createComment({
        ...context.repo(),
        issue_number: context.payload.pull_request.number,
        body: 'Lint workflow failed'
      });
      return;
    }
    throw error;
  }
}
  