// Core data collection functions
import { 
  App, 
  GithubContext, 
  PullRequest, 
  PRData, 
  Comment, 
  FileChange, 
  CodeChanges, 
  LinkedIssue,
  PatchResult
} from './types.js';

export async function getAllPrDetails(context: GithubContext, app: App): Promise<PRData> {
  const { pull_request: pr } = context.payload;
  const { owner, repo } = context.repo();
  const filesResult = await getPrFilesAndDiffs(context, app, owner, repo, pr.number);
  
  // Extract issue number from PR body or title using regex
  const issueNumber = extractIssueNumber(pr.body || pr.title);
  const issueData = issueNumber ? await getLinkedIssueData(context, app, owner, repo, issueNumber) : null;
  
  // Get repository context
  const repoContext = await getRepositoryContext(context, app);

  return {
      metadata: getPrMetadata(pr),
      comments: await getPrComments(context, app, owner, repo, pr.number),
      files: filesResult,
      relationships: {
          requested_reviewers: pr.requested_reviewers?.map((u) => u.login) || [],
          assignees: pr.assignees?.map((u) => u.login) || [],
          labels: pr.labels?.map((l) => l.name) || []
      },
      code_changes: extractCodeChangesForLLM(app, filesResult),
      linked_issue: issueData,
      repository: repoContext
  };
}

function extractIssueNumber(text: string): number | null {
  // Look for patterns like "fixes #123", "closes #123", "related to #123"
  const match = text?.match(/#(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function getLinkedIssueData(context: GithubContext, app: App, owner: string, repo: string, issueNumber: number): Promise<LinkedIssue | null> {
  try {
      const issue = await context.octokit.issues.get({
          owner,
          repo,
          issue_number: issueNumber
      });

      const comments = await context.octokit.paginate(
          context.octokit.issues.listComments,
          { owner, repo, issue_number: issueNumber }
      );

      return {
          number: issueNumber,
          title: issue.data.title,
          body: issue.data.body,
          state: issue.data.state,
          author: issue.data.user.login,
          created_at: issue.data.created_at,
          updated_at: issue.data.updated_at,
          labels: issue.data.labels.map((l: { name: string }) => l.name),
          assignees: issue.data.assignees.map((a: { login: string }) => a.login),
          comments: comments.map((c: { user: { login: string }, body: string, created_at: string }) => ({
              author: c.user.login,
              body: c.body,
              created_at: c.created_at
          }))
      };
  } catch (error) {
      app.log.error('Error fetching linked issue data:', error);
      return null;
  }
}

// Update extractCodeChangesForLLM to handle the files array directly
export function extractCodeChangesForLLM(app: App, files: FileChange[]): CodeChanges {
  app.log.info("Processing code changes for files");
  // Using string interpolation to safely convert object to string for logging
  app.log.info(`Files: ${files.length} items`);

  // Check if files is an array; if not, log error and return empty
  if (!Array.isArray(files)) {
      app.log.error('Invalid files data:', files);
      return {
          summary: { files_changed: 0, total_additions: 0, total_deletions: 0 },
          changes: []
      };
  }

  // const codeFileExtensions = ['.js', '.py', '.java', '.cpp', '.ts', '.go', '.rs', '.php', '.rb'];
  
  const codeChanges = files
      // .filter((file) => {
      //     const ext = '.' + file.filename.split('.').pop().toLowerCase();
      //     return codeFileExtensions.includes(ext);
      // })
      .map((file) => {
          const changes = parsePatch(file.patch);
          return {
              file: file.filename,
              type: file.status,
              changes: {
                  removed: changes.removed.join('\n'),
                  added: changes.added.join('\n')
              },
              stats: {
                  additions: file.additions,
                  deletions: file.deletions
              }
          };
      });

  return {
      summary: {
          files_changed: codeChanges.length,
          total_additions: codeChanges.reduce((sum, file) => sum + file.stats.additions, 0),
          total_deletions: codeChanges.reduce((sum, file) => sum + file.stats.deletions, 0)
      },
      changes: codeChanges
  };
}

// Ensure getPrFilesAndDiffs returns an empty array on error
export async function getPrFilesAndDiffs(context: GithubContext, app: App, owner: string, repo: string, prNumber: number): Promise<FileChange[]> {
  try {
      const files = await context.octokit.paginate(
          context.octokit.pulls.listFiles,
          { owner, repo, pull_number: prNumber }
      );
      return files.map((file: { 
        filename: string, 
        status: string, 
        additions: number, 
        deletions: number, 
        changes: number, 
        patch?: string 
      }) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch || 'Diff too large to display'
      }));
  } catch (error) {
      app.log.error('Error fetching files:', error);
      return []; 
  }
}

function getPrMetadata(pr: PullRequest) {
  return {
    title: pr.title,
    body: pr.body,
    author: pr.user.login,
    state: pr.state,
    draft: pr.draft,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    mergeable: pr.mergeable,
    additions: pr.additions,
    deletions: pr.deletions,
    changed_files: pr.changed_files,
    base: {
      branch: pr.base.ref,
      sha: pr.base.sha
    },
    head: {
      branch: pr.head.ref,
      sha: pr.head.sha
    }
  };
}

export async function getPrComments(
  context: {
    payload?: { pull_request: PullRequest };
    repo?: () => { owner: string; repo: string };
    octokit?: {
      issues: { listComments: Function };
      pulls: { listReviewComments: Function };
      paginate: Function;
    }
  }, 
  app: App, 
  owner: string, 
  repo: string, 
  prNumber: number
) {
  try {
    if (!context.octokit) {
      app.log.error('Octokit is undefined');
      return { issue_comments: [], review_comments: [] };
    }

    const [issueComments, reviewComments] = await Promise.all([
      context.octokit.paginate(context.octokit.issues.listComments, {
        owner, repo, issue_number: prNumber
      }),
      context.octokit.paginate(context.octokit.pulls.listReviewComments, {
        owner, repo, pull_number: prNumber
      })
    ]);

    return {
      issue_comments: issueComments.map(formatComment),
      review_comments: reviewComments.map(formatComment)
    };
  } catch (error) {
    app.log.error('Error fetching comments:', error);
    return { issue_comments: [], review_comments: [] };
  }
}

function formatComment(comment: {
  id: number;
  user?: { login: string };
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}): Comment {
  return {
    id: comment.id,
    user: comment.user?.login || 'unknown',
    body: comment.body,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    url: comment.html_url
  };
}

function parsePatch(patch: string | undefined): PatchResult {
  if (!patch || patch === 'Diff too large to display') {
    return { added: [], removed: [] };
  }

  const lines = patch.split('\n');
  const added: string[] = [];
  const removed: string[] = [];

  lines.forEach((line: string) => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(line.substring(1));
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed.push(line.substring(1));
    }
  });

  return { added, removed };
}

async function getRepositoryContext(context: GithubContext, app: App) {
  const { owner, repo } = context.repo();
  try {
    // Fetch README content
    const readmeResponse = await context.octokit.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: 'raw',
      },
    });
    
    // Fetch repository structure using git trees
    const repoStructure = await context.octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true'
    });

    const folderStructure = repoStructure.data.tree
      .filter((item: { path: string }) => !item.path.includes('node_modules/')) // Exclude node_modules
      .map((item: { path: string }) => item.path)
      .join('\n');

    return {
      readme: readmeResponse.data,
      structure: folderStructure,
      name: repo,
      owner: owner
    };
  } catch (error) {
    app.log.error('Error fetching repository context:', error);
    return {
      readme: 'Failed to fetch README',
      structure: 'Failed to fetch repository structure',
      name: repo,
      owner: owner
    };
  }
}