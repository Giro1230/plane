from django.urls import path

from plane.api.views.git import (
    GitRepositoryConnectionView,
    GitCommitHistoryView, 
    GitSyncView
)

urlpatterns = [
    # Git 저장소 연결 관리
    path(
        "workspaces/<str:workspace_slug>/projects/<uuid:project_id>/git-connection/",
        GitRepositoryConnectionView.as_view(),
        name="git-repository-connection",
    ),
    # Git 커밋 히스토리 조회  
    path(
        "workspaces/<str:workspace_slug>/projects/<uuid:project_id>/git-history/commits/",
        GitCommitHistoryView.as_view(),
        name="git-commit-history",
    ),
    # Git 데이터 동기화
    path(
        "workspaces/<str:workspace_slug>/projects/<uuid:project_id>/git-history/sync/",
        GitSyncView.as_view(),
        name="git-sync",
    ),
] 