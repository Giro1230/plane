// GitHub Git 히스토리 관련 타입 정의
export interface IGitCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
  };
  url: string;
  html_url: string;
  author: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url: string;
  }>;
}

export interface IGitBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  protection: {
    enabled: boolean;
    required_status_checks: {
      enforcement_level: string;
      contexts: string[];
    };
  };
}

export interface IGitRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface IGitCommitHistory {
  repository: IGitRepository;
  commits: IGitCommit[];
  branches: IGitBranch[];
  totalCommits: number;
  hasMore: boolean;
}

export interface IGitHistoryFilters {
  author?: string;
  since?: string;
  until?: string;
  branch?: string;
  path?: string;
  per_page?: number;
  page?: number;
}

// 프로젝트별 Git 연결 정보
export interface IProjectGitConnection {
  id: string;
  project_id: string;
  repository_url: string;
  repository_name: string;
  repository_owner: string;
  branch: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
} 