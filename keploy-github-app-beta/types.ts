// GitHub API related types
export interface Repository {
  name: string;
  owner: string;
  readme: string;
  structure: string;
}

export interface User {
  login: string;
}

export interface Label {
  name: string;
}

export interface Comment {
  id: number;
  user: string;
  body: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface IssueComment {
  author: string;
  body: string;
  created_at: string;
}

export interface PullRequest {
  title: string;
  body: string | null;
  user: User;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  mergeable: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  number: number;
  requested_reviewers?: User[];
  assignees?: User[];
  labels?: Label[];
  base: {
    ref: string;
    sha: string;
  };
  head: {
    ref: string;
    sha: string;
  };
}

export interface PRMetadata {
  title: string;
  body: string | null;
  author: string;
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  mergeable: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  base: {
    branch: string;
    sha: string;
  };
  head: {
    branch: string;
    sha: string;
  };
}

export interface PRComments {
  issue_comments: Comment[];
  review_comments: Comment[];
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
}

export interface CodeChange {
  file: string;
  type: string;
  changes: {
    removed: string;
    added: string;
  };
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface CodeChanges {
  summary: {
    files_changed: number;
    total_additions: number;
    total_deletions: number;
  };
  changes: CodeChange[];
}

export interface LinkedIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  author: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  assignees: string[];
  comments: IssueComment[];
}

export interface PRData {
  metadata: PRMetadata;
  comments: PRComments;
  files: FileChange[];
  relationships: {
    requested_reviewers: string[];
    assignees: string[];
    labels: string[];
  };
  code_changes: CodeChanges;
  linked_issue: LinkedIssue | null;
  repository: Repository;
}

// GitHub context types
export interface GithubContext {
  octokit: {
    issues: {
      createComment: (params: any) => Promise<any>;
      get: (params: any) => Promise<any>;
      listComments: Function;
      removeLabel: (params: any) => Promise<any>;
      addLabels: (params: any) => Promise<any>;
    };
    pulls: {
      listFiles: Function;
      listReviewComments: Function;
    };
    repos: {
      getReadme: (params: any) => Promise<any>;
      getContent: (params: any) => Promise<any>;
    };
    actions: {
      createWorkflowDispatch: (params: any) => Promise<any>;
    };
    git: {
      getTree: (params: any) => Promise<any>;
    };
    paginate: Function;
  };
  repo: () => { owner: string; repo: string };
  payload: {
    pull_request: PullRequest;
  };
}

// App types
export interface App {
  log: {
    info: (message: string, context?: any) => void;
    error: (message: string, error?: any) => void;
  };
  on?: (events: string[], callback: (context: GithubContext) => Promise<void>) => void;
}

// Rule types
export interface Rules {
  success: boolean;
  rules: string;
  error?: string;
}

// Patch parsing result
export interface PatchResult {
  added: string[];
  removed: string[];
}

// Configuration types
export interface Config {
  useCase: string;
  apiEndpoint: string;
  selectedModel: string;
}

// Model related types
export interface Model {
  name: string;
  link: string;
}

export interface UseCase {
  name: string;
  suggestedModels: Model[];
}

export interface UseCaseModels {
  [key: string]: UseCase;
} 