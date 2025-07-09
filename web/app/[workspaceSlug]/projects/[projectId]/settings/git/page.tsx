"use client";

import React from "react";
import { observer } from "mobx-react";
import { GitIntegrationSettings } from "@/components/project/settings/git-integration";
import { AppHeader } from "@/components/core";
import { ProjectSettingsSidebar } from "@/components/project";

interface PageProps {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
}

const GitSettingsPage: React.FC<PageProps> = observer(({ params }) => {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader />
      <div className="flex h-full w-full">
        <ProjectSettingsSidebar />
        <div className="flex h-full w-full flex-col">
          <div className="flex w-full items-center justify-between gap-4 border-b border-custom-border-300 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Git 통합 설정</h3>
              <div className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                GitHub
              </div>
            </div>
          </div>
          
          <div className="h-full w-full overflow-y-auto p-6">
            <GitIntegrationSettings 
              workspaceSlug={workspaceSlug}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </>
  );
});

GitSettingsPage.displayName = "GitSettingsPage";

export default GitSettingsPage; 