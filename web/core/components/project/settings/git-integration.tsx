import React, { useState } from "react";
import { observer } from "mobx-react";
import { Settings, GitBranch, Link as LinkIcon, Trash2, Check } from "lucide-react";
import { Button, Input } from "@plane/ui";

interface Props {
  workspaceSlug: string;
  projectId: string;
}

export const GitIntegrationSettings: React.FC<Props> = observer(({ workspaceSlug, projectId }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  
  // 임시 연결 상태 (실제로는 API에서 가져와야 함)
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    repository_name: "plane-project",
    repository_owner: "myorg",
    repository_url: "https://github.com/myorg/plane-project",
    branch: "main",
    last_sync_at: "2024-01-15T10:30:00Z",
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Git 저장소 연결 로직
      console.log("Git 저장소 연결:", repositoryUrl);
      // await gitService.connectProjectToGitRepository(workspaceSlug, projectId, {
      //   repository_url: repositoryUrl,
      //   repository_name: "extracted-name",
      //   repository_owner: "extracted-owner",
      //   branch: selectedBranch,
      // });
      setIsConnected(true);
    } catch (error) {
      console.error("연결 실패:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // await gitService.disconnectGitRepository(workspaceSlug, projectId);
      setIsConnected(false);
      console.log("Git 저장소 연결 해제");
    } catch (error) {
      console.error("연결 해제 실패:", error);
    }
  };

  const handleSync = async () => {
    try {
      // await gitService.syncGitData(workspaceSlug, projectId);
      console.log("Git 데이터 동기화");
    } catch (error) {
      console.error("동기화 실패:", error);
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="border-b border-custom-border-200 pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-custom-text-300" />
          <h2 className="text-lg font-semibold text-custom-text-100">Git 저장소 연결</h2>
        </div>
        <p className="mt-1 text-sm text-custom-text-300">
          GitHub 저장소를 연결하여 커밋 히스토리를 추적하고 이슈와 연동하세요.
        </p>
      </div>

      {!isConnected ? (
        /* 연결되지 않은 상태 */
        <div className="space-y-4">
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-custom-text-100 mb-2">
                  GitHub 저장소 URL
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-custom-text-300">
                  공개 저장소 또는 접근 권한이 있는 비공개 저장소 URL을 입력하세요.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-custom-text-100 mb-2">
                  기본 브랜치
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full rounded border border-custom-border-300 bg-custom-background-100 px-3 py-2 text-sm"
                >
                  <option value="main">main</option>
                  <option value="master">master</option>
                  <option value="develop">develop</option>
                  <option value="dev">dev</option>
                </select>
              </div>

              <Button
                variant="primary"
                onClick={handleConnect}
                loading={isConnecting}
                disabled={!repositoryUrl.trim()}
                className="w-full"
              >
                {isConnecting ? "연결 중..." : "저장소 연결"}
              </Button>
            </div>
          </div>

          {/* 연결 안내 */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Git 연결 후 사용 가능한 기능
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 실시간 커밋 히스토리 추적</li>
              <li>• 커밋 메시지에서 이슈 자동 연결 (#123 형식)</li>
              <li>• 브랜치별 개발 진행 상황 모니터링</li>
              <li>• 개발자별 기여도 통계</li>
            </ul>
          </div>
        </div>
      ) : (
        /* 연결된 상태 */
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    저장소가 연결되었습니다
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {connectionInfo.repository_owner}/{connectionInfo.repository_name}
                  </p>
                </div>
              </div>
              <Button
                variant="outline-without-border"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-green-700 dark:text-green-300 font-medium">저장소:</span>
                <a
                  href={connectionInfo.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-green-600 dark:text-green-400 hover:underline"
                >
                  {connectionInfo.repository_name}
                </a>
              </div>
              <div>
                <span className="text-green-700 dark:text-green-300 font-medium">브랜치:</span>
                <span className="ml-1 text-green-600 dark:text-green-400">
                  {connectionInfo.branch}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-green-700 dark:text-green-300 font-medium">마지막 동기화:</span>
                <span className="ml-1 text-green-600 dark:text-green-400">
                  {formatLastSync(connectionInfo.last_sync_at)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSync}>
                지금 동기화
              </Button>
              <Button variant="neutral-primary" size="sm">
                <LinkIcon className="h-4 w-4 mr-1" />
                히스토리 보기
              </Button>
            </div>
          </div>

          {/* 동기화 설정 */}
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
            <h3 className="text-sm font-medium text-custom-text-100 mb-3">동기화 설정</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-custom-border-300 text-custom-primary-100"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-custom-text-200">
                  새 커밋 시 자동 동기화
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-custom-border-300 text-custom-primary-100"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-custom-text-200">
                  커밋 메시지에서 이슈 번호 자동 연결 (#123 형식)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-custom-border-300 text-custom-primary-100"
                />
                <span className="ml-2 text-sm text-custom-text-200">
                  PR/MR 상태 변경 시 이슈 상태 자동 업데이트
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GitIntegrationSettings.displayName = "GitIntegrationSettings"; 