import { API_BASE_URL } from "@plane/constants";
import { IGitCommitHistory, IGitCommit, IGitBranch, IGitRepository, IGitHistoryFilters, IProjectGitConnection } from "@plane/types";
import { APIService } from "@/services/api.service";

export class GitService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // 프로젝트의 Git 연결 정보 가져오기
  async getProjectGitConnection(workspaceSlug: string, projectId: string): Promise<IProjectGitConnection> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-connection/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 프로젝트에 Git 저장소 연결
  async connectProjectToGitRepository(
    workspaceSlug: string,
    projectId: string,
    data: {
      repository_url: string;
      repository_name: string;
      repository_owner: string;
      branch: string;
    }
  ): Promise<IProjectGitConnection> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-connection/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // GitHub 커밋 히스토리 가져오기
  async getCommitHistory(
    workspaceSlug: string,
    projectId: string,
    filters?: IGitHistoryFilters
  ): Promise<IGitCommitHistory> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-history/commits?${params.toString()}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 특정 커밋 정보 가져오기
  async getCommitDetails(
    workspaceSlug: string,
    projectId: string,
    commitSha: string
  ): Promise<IGitCommit> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-history/commits/${commitSha}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 저장소의 브랜치 목록 가져오기
  async getBranches(workspaceSlug: string, projectId: string): Promise<IGitBranch[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-history/branches/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 저장소 정보 가져오기
  async getRepositoryInfo(workspaceSlug: string, projectId: string): Promise<IGitRepository> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-history/repository/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Git 연결 해제
  async disconnectGitRepository(workspaceSlug: string, projectId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-connection/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 수동으로 Git 데이터 동기화
  async syncGitData(workspaceSlug: string, projectId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/git-history/sync/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
} 