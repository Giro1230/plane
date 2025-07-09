import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { GitBranch, GitCommit, Calendar, User, ExternalLink, RefreshCw } from "lucide-react";
import { Button, Loader } from "@plane/ui";
import useSWR from "swr";
// import { GitService } from "@/services/git.service";
// import { IGitCommit, IGitHistoryFilters } from "@plane/types";

// 임시 타입 정의 (실제로는 @plane/types에서 가져와야 함)
interface IGitCommit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    message: string;
  };
  author: { login: string; avatar_url: string; html_url: string } | null;
  html_url: string;
}

interface IGitHistoryFilters {
  author?: string;
  since?: string;
  until?: string;
  branch?: string;
  per_page?: number;
  page?: number;
}

interface Props {
  workspaceSlug: string;
  projectId: string;
}

// const gitService = new GitService();

export const GitCommitList: React.FC<Props> = observer(({ workspaceSlug, projectId }) => {
  const [filters, setFilters] = useState<IGitHistoryFilters>({
    branch: "main",
    per_page: 20,
    page: 1,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 실제로는 SWR로 데이터를 가져와야 함
  // const { data: commitHistory, error, mutate } = useSWR(
  //   workspaceSlug && projectId ? `git-history-${workspaceSlug}-${projectId}` : null,
  //   () => gitService.getCommitHistory(workspaceSlug, projectId, filters)
  // );

  // 데모용 더미 데이터
  const commitHistory = {
    commits: [
      {
        sha: "abc123",
        commit: {
          author: { name: "김개발", email: "dev@example.com", date: "2024-01-15T10:30:00Z" },
          message: "이슈 #123 수정: 로그인 버그 해결",
        },
        author: { login: "kimdev", avatar_url: "/api/placeholder/32/32", html_url: "https://github.com/kimdev" },
        html_url: "https://github.com/repo/commit/abc123",
      },
      {
        sha: "def456",
        commit: {
          author: { name: "박프론트", email: "front@example.com", date: "2024-01-14T15:45:00Z" },
          message: "새로운 대시보드 UI 컴포넌트 추가",
        },
        author: { login: "parkfront", avatar_url: "/api/placeholder/32/32", html_url: "https://github.com/parkfront" },
        html_url: "https://github.com/repo/commit/def456",
      },
    ] as IGitCommit[],
    hasMore: true,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // await mutate();
      console.log("Git 데이터 새로고침");
    } catch (error) {
      console.error("새로고침 실패:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-custom-text-300" />
          <h2 className="text-lg font-semibold text-custom-text-100">Git 커밋 히스토리</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            className="rounded border border-custom-border-300 bg-custom-background-100 px-3 py-1 text-sm"
          >
            <option value="main">main</option>
            <option value="develop">develop</option>
            <option value="feature/new-ui">feature/new-ui</option>
          </select>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-4 rounded-lg bg-custom-background-90 p-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-custom-text-300" />
          <input
            type="text"
            placeholder="작성자 필터링..."
            value={filters.author || ""}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
            className="rounded border border-custom-border-300 bg-custom-background-100 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-custom-text-300" />
          <input
            type="date"
            value={filters.since || ""}
            onChange={(e) => setFilters({ ...filters, since: e.target.value })}
            className="rounded border border-custom-border-300 bg-custom-background-100 px-2 py-1 text-sm"
          />
          <span className="text-custom-text-300">부터</span>
        </div>
      </div>

      {/* 커밋 목록 */}
      <div className="space-y-3">
        {commitHistory?.commits?.map((commit) => (
          <div
            key={commit.sha}
            className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4 hover:bg-custom-background-90 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* 작성자 아바타 */}
              <img
                src={commit.author?.avatar_url || "/api/placeholder/32/32"}
                alt={commit.author?.login || "Unknown"}
                className="h-8 w-8 rounded-full"
              />
              
              <div className="flex-1 min-w-0">
                {/* 커밋 메시지 */}
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-custom-text-100 break-words">
                    {commit.commit.message}
                  </p>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-2 text-custom-text-300 hover:text-custom-text-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                {/* 커밋 정보 */}
                <div className="mt-2 flex items-center gap-4 text-xs text-custom-text-300">
                  <span className="flex items-center gap-1">
                    <GitCommit className="h-3 w-3" />
                    {commit.sha.substring(0, 7)}
                  </span>
                  <span>{commit.commit.author.name}</span>
                  <span>{formatRelativeTime(commit.commit.date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 더 보기 버튼 */}
      {commitHistory?.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="neutral-primary"
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            더 많은 커밋 보기
          </Button>
        </div>
      )}

      {/* 로딩 상태 */}
      {!commitHistory && (
        <div className="flex justify-center py-8">
          <Loader>
            <Loader.Item height="60px" width="100%" />
            <Loader.Item height="60px" width="100%" />
            <Loader.Item height="60px" width="100%" />
          </Loader>
        </div>
      )}
    </div>
  );
});

GitCommitList.displayName = "GitCommitList"; 