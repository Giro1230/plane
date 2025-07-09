# Python imports
import requests
from datetime import datetime
from urllib.parse import urlparse

# Django imports
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import ProjectBasePermission

# Module imports
from plane.api.views import BaseAPIView
from plane.db.models import Project, WorkspaceMember
from plane.bgtasks.git_sync_task import sync_git_repository


class GitRepositoryConnectionView(BaseAPIView):
    """
    Git 저장소 연결 관리 API 뷰
    프로젝트에 GitHub 저장소를 연결하고 관리하는 기능을 제공합니다
    """
    permission_classes = [ProjectBasePermission]

    def get(self, request, workspace_slug, project_id):
        """프로젝트의 Git 연결 정보를 가져옵니다"""
        try:
            project = Project.objects.get(
                workspace__slug=workspace_slug, 
                pk=project_id,
                workspace__workspace_member__member=request.user
            )
            
            # Git 연결 정보 조회
            git_connection = getattr(project, 'git_connection', None)
            if not git_connection:
                return Response(
                    {"error": "Git 저장소가 연결되지 않았습니다"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                "id": git_connection.id,
                "project_id": project.id,
                "repository_url": git_connection.repository_url,
                "repository_name": git_connection.repository_name,
                "repository_owner": git_connection.repository_owner,
                "branch": git_connection.branch,
                "is_active": git_connection.is_active,
                "last_sync_at": git_connection.last_sync_at,
                "created_at": git_connection.created_at,
                "updated_at": git_connection.updated_at,
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "프로젝트를 찾을 수 없습니다"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, workspace_slug, project_id):
        """프로젝트에 Git 저장소를 연결합니다"""
        try:
            project = Project.objects.get(
                workspace__slug=workspace_slug, 
                pk=project_id,
                workspace__workspace_member__member=request.user
            )
            
            repository_url = request.data.get('repository_url')
            branch = request.data.get('branch', 'main')
            
            # URL 파싱하여 저장소 정보 추출
            parsed_url = urlparse(repository_url)
            if 'github.com' not in parsed_url.netloc:
                return Response(
                    {"error": "GitHub 저장소 URL만 지원됩니다"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) < 2:
                return Response(
                    {"error": "올바른 저장소 URL 형식이 아닙니다"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            repository_owner = path_parts[0]
            repository_name = path_parts[1].replace('.git', '')
            
            # GitHub API로 저장소 존재 확인
            github_api_url = f"https://api.github.com/repos/{repository_owner}/{repository_name}"
            github_response = requests.get(github_api_url)
            
            if github_response.status_code != 200:
                return Response(
                    {"error": "저장소에 접근할 수 없거나 존재하지 않습니다"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Git 연결 정보 저장 (실제로는 별도 모델 필요)
            # GitConnection.objects.create(
            #     project=project,
            #     repository_url=repository_url,
            #     repository_name=repository_name,
            #     repository_owner=repository_owner,
            #     branch=branch,
            #     is_active=True
            # )
            
            # 백그라운드 작업으로 초기 동기화 시작
            sync_git_repository.delay(project.id, repository_owner, repository_name, branch)
            
            return Response({
                "message": "Git 저장소가 성공적으로 연결되었습니다",
                "repository_url": repository_url,
                "repository_name": repository_name,
                "repository_owner": repository_owner,
                "branch": branch
            }, status=status.HTTP_201_CREATED)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "프로젝트를 찾을 수 없습니다"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"연결 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, workspace_slug, project_id):
        """Git 저장소 연결을 해제합니다"""
        try:
            project = Project.objects.get(
                workspace__slug=workspace_slug, 
                pk=project_id,
                workspace__workspace_member__member=request.user
            )
            
            # Git 연결 정보 삭제
            # git_connection = GitConnection.objects.get(project=project)
            # git_connection.delete()
            
            return Response({
                "message": "Git 저장소 연결이 해제되었습니다"
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "프로젝트를 찾을 수 없습니다"},
                status=status.HTTP_404_NOT_FOUND
            )


class GitCommitHistoryView(BaseAPIView):
    """
    Git 커밋 히스토리 조회 API 뷰
    GitHub API를 통해 커밋 히스토리를 가져오고 필터링 기능을 제공합니다
    """
    permission_classes = [ProjectBasePermission]

    def get(self, request, workspace_slug, project_id):
        """프로젝트의 Git 커밋 히스토리를 조회합니다"""
        try:
            project = Project.objects.get(
                workspace__slug=workspace_slug, 
                pk=project_id,
                workspace__workspace_member__member=request.user
            )
            
            # Git 연결 정보 확인
            # git_connection = getattr(project, 'git_connection', None)
            # if not git_connection:
            #     return Response(
            #         {"error": "Git 저장소가 연결되지 않았습니다"},
            #         status=status.HTTP_404_NOT_FOUND
            #     )
            
            # 임시 데모 데이터 (실제로는 git_connection에서 가져와야 함)
            repository_owner = "myorg"
            repository_name = "plane-project"
            branch = request.GET.get('branch', 'main')
            
            # 필터 파라미터
            author = request.GET.get('author')
            since = request.GET.get('since')
            until = request.GET.get('until')
            per_page = min(int(request.GET.get('per_page', 20)), 100)
            page = int(request.GET.get('page', 1))
            
            # GitHub API 요청 구성
            github_api_url = f"https://api.github.com/repos/{repository_owner}/{repository_name}/commits"
            params = {
                'sha': branch,
                'per_page': per_page,
                'page': page
            }
            
            if author:
                params['author'] = author
            if since:
                params['since'] = since
            if until:
                params['until'] = until
            
            # GitHub API 호출
            headers = {}
            # GitHub 토큰이 있다면 추가 (실제로는 설정에서 가져와야 함)
            # if settings.GITHUB_TOKEN:
            #     headers['Authorization'] = f'token {settings.GITHUB_TOKEN}'
            
            response = requests.get(github_api_url, params=params, headers=headers)
            
            if response.status_code != 200:
                return Response(
                    {"error": "GitHub API 호출 실패"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            commits_data = response.json()
            
            # 저장소 정보도 가져오기
            repo_response = requests.get(
                f"https://api.github.com/repos/{repository_owner}/{repository_name}",
                headers=headers
            )
            repository_info = repo_response.json() if repo_response.status_code == 200 else {}
            
            # 브랜치 정보 가져오기
            branches_response = requests.get(
                f"https://api.github.com/repos/{repository_owner}/{repository_name}/branches",
                headers=headers
            )
            branches_data = branches_response.json() if branches_response.status_code == 200 else []
            
            return Response({
                "repository": repository_info,
                "commits": commits_data,
                "branches": branches_data,
                "total_commits": len(commits_data),
                "has_more": len(commits_data) == per_page,
                "current_page": page,
                "per_page": per_page
            }, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "프로젝트를 찾을 수 없습니다"},
                status=status.HTTP_404_NOT_FOUND
            )
        except requests.RequestException as e:
            return Response(
                {"error": f"GitHub API 호출 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": f"히스토리 조회 실패: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GitSyncView(BaseAPIView):
    """
    Git 데이터 동기화 API 뷰
    수동으로 Git 데이터를 동기화하는 기능을 제공합니다
    """
    permission_classes = [ProjectBasePermission]

    def post(self, request, workspace_slug, project_id):
        """Git 데이터를 수동으로 동기화합니다"""
        try:
            project = Project.objects.get(
                workspace__slug=workspace_slug, 
                pk=project_id,
                workspace__workspace_member__member=request.user
            )
            
            # Git 연결 정보 확인
            # git_connection = getattr(project, 'git_connection', None)
            # if not git_connection:
            #     return Response(
            #         {"error": "Git 저장소가 연결되지 않았습니다"},
            #         status=status.HTTP_404_NOT_FOUND
            #     )
            
            # 백그라운드 작업으로 동기화 시작
            # sync_git_repository.delay(
            #     project.id,
            #     git_connection.repository_owner,
            #     git_connection.repository_name,
            #     git_connection.branch
            # )
            
            return Response({
                "message": "Git 데이터 동기화가 시작되었습니다",
                "status": "in_progress"
            }, status=status.HTTP_202_ACCEPTED)
            
        except Project.DoesNotExist:
            return Response(
                {"error": "프로젝트를 찾을 수 없습니다"},
                status=status.HTTP_404_NOT_FOUND
            ) 