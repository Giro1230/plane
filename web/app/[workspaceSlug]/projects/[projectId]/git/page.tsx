"use client";

import React from "react";
import { observer } from "mobx-react";
import { GitCommitList } from "@/components/git-history/git-commit-list";
import { AppHeader } from "@/components/core";
import { ProjectSidebarHeader } from "@/components/headers";

interface PageProps {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
}

const GitHistoryPage: React.FC<PageProps> = observer(({ params }) => {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader header={<ProjectSidebarHeader />} />
      <div className="flex h-full w-full flex-col">
        <div className="flex w-full items-center justify-between gap-4 border-b border-custom-border-300 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">Git 히스토리</h3>
            <div className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500">
              GitHub 연동
            </div>
          </div>
        </div>
        
        <div className="h-full w-full overflow-hidden">
          <GitCommitList 
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      </div>
    </>
  );
});

GitHistoryPage.displayName = "GitHistoryPage";

export default GitHistoryPage; 