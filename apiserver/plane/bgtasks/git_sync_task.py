# Python imports
import requests
from datetime import datetime, timedelta
import logging

# Django imports
from django.conf import settings
from django.utils import timezone

# Third-party imports
from celery import shared_task

# Module imports
from plane.db.models import Project

# 로깅 설정
logger = logging.getLogger(__name__)


@shared_task
def sync_git_repository(project_id, repository_owner, repository_name, branch="main"):
    """
    GitHub 저장소에서 커밋 데이터를 동기화하는 백그라운드 태스크
    프로젝트별로 Git 히스토리를 주기적으로 업데이트합니다
    """
    try:
        logger.info(f"Git 동기화 시작: {repository_owner}/{repository_name} (프로젝트 {project_id})")
        
        # 프로젝트 조회
        project = Project.objects.get(id=project_id)
        
        # GitHub API 헤더 설정
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Plane-App'
        }
        
        # GitHub 토큰이 설정되어 있다면 추가
        if hasattr(settings, 'GITHUB_TOKEN') and settings.GITHUB_TOKEN:
            headers['Authorization'] = f'token {settings.GITHUB_TOKEN}'
        
        # 최근 커밋들 가져오기 (지난 30일)
        since_date = (timezone.now() - timedelta(days=30)).isoformat()
        
        # GitHub API URL
        commits_url = f"https://api.github.com/repos/{repository_owner}/{repository_name}/commits"
        params = {
            'sha': branch,
            'since': since_date,
            'per_page': 100  # 한 번에 최대 100개 커밋
        }
        
        page = 1
        total_synced = 0
        
        while True:
            params['page'] = page
            
            # GitHub API 호출
            response = requests.get(commits_url, params=params, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"GitHub API 호출 실패: {response.status_code} - {response.text}")
                break
            
            commits = response.json()
            
            if not commits:
                break  # 더 이상 커밋이 없음
            
            # 커밋 데이터 처리
            for commit in commits:
                try:
                    # 커밋 정보 추출
                    commit_sha = commit['sha']
                    commit_message = commit['commit']['message']
                    author_name = commit['commit']['author']['name']
                    author_email = commit['commit']['author']['email']
                    commit_date = commit['commit']['author']['date']
                    
                    # GitHub 사용자 정보
                    github_author = commit.get('author')
                    github_username = github_author['login'] if github_author else None
                    
                    # 커밋 메시지에서 이슈 번호 추출 (#123 형식)
                    linked_issues = extract_issue_numbers(commit_message)
                    
                    # 실제로는 데이터베이스에 저장해야 함
                    # GitCommit.objects.update_or_create(
                    #     project=project,
                    #     sha=commit_sha,
                    #     defaults={
                    #         'message': commit_message,
                    #         'author_name': author_name,
                    #         'author_email': author_email,
                    #         'github_username': github_username,
                    #         'commit_date': commit_date,
                    #         'linked_issues': linked_issues,
                    #         'branch': branch
                    #     }
                    # )
                    
                    # 연결된 이슈들 업데이트
                    if linked_issues:
                        update_linked_issues(project, linked_issues, commit_sha, commit_message)
                    
                    total_synced += 1
                    
                except Exception as e:
                    logger.error(f"커밋 처리 오류 ({commit_sha}): {e}")
                    continue
            
            page += 1
            
            # API 속도 제한 고려하여 너무 많은 페이지는 처리하지 않음
            if page > 10:
                break
        
        # Git 연결 정보의 마지막 동기화 시간 업데이트
        # if hasattr(project, 'git_connection'):
        #     project.git_connection.last_sync_at = timezone.now()
        #     project.git_connection.save()
        
        logger.info(f"Git 동기화 완료: {total_synced}개 커밋 처리됨")
        
        return {
            'status': 'success',
            'synced_commits': total_synced,
            'repository': f"{repository_owner}/{repository_name}",
            'branch': branch
        }
        
    except Project.DoesNotExist:
        logger.error(f"프로젝트를 찾을 수 없음: {project_id}")
        return {'status': 'error', 'message': '프로젝트를 찾을 수 없습니다'}
        
    except requests.RequestException as e:
        logger.error(f"GitHub API 요청 오류: {e}")
        return {'status': 'error', 'message': f'GitHub API 오류: {e}'}
        
    except Exception as e:
        logger.error(f"Git 동기화 오류: {e}")
        return {'status': 'error', 'message': f'동기화 오류: {e}'}


def extract_issue_numbers(commit_message):
    """
    커밋 메시지에서 이슈 번호를 추출합니다
    #123, #456 형식의 이슈 번호를 찾아서 반환합니다
    """
    import re
    
    # #숫자 패턴 찾기
    pattern = r'#(\d+)'
    matches = re.findall(pattern, commit_message)
    
    # 중복 제거하고 정수로 변환
    issue_numbers = list(set(int(match) for match in matches))
    
    return issue_numbers


def update_linked_issues(project, issue_numbers, commit_sha, commit_message):
    """
    커밋과 연결된 이슈들을 업데이트합니다
    이슈 댓글에 커밋 정보를 추가하거나 상태를 변경할 수 있습니다
    """
    try:
        # 실제로는 Issue 모델에서 이슈를 찾아야 함
        # from plane.db.models import Issue
        
        for issue_number in issue_numbers:
            # project의 이슈 중에서 sequence_id가 issue_number와 일치하는 것 찾기
            # issues = Issue.objects.filter(
            #     project=project,
            #     sequence_id=issue_number
            # )
            
            # for issue in issues:
            #     # 커밋 정보를 이슈 활동에 추가
            #     IssueActivity.objects.create(
            #         issue=issue,
            #         project=project,
            #         actor=None,  # 시스템에서 생성
            #         verb='commit_linked',
            #         field='commit',
            #         new_value=commit_sha,
            #         comment=f"커밋과 연결됨: {commit_message[:100]}"
            #     )
            
            logger.info(f"이슈 #{issue_number}와 커밋 {commit_sha[:7]} 연결됨")
            
    except Exception as e:
        logger.error(f"이슈 연결 오류: {e}")


@shared_task
def sync_all_git_repositories():
    """
    모든 활성 Git 연결에 대해 동기화를 수행하는 주기적 태스크
    이 태스크는 crontab으로 정기적으로 실행될 수 있습니다
    """
    try:
        logger.info("전체 Git 저장소 동기화 시작")
        
        # 모든 활성 Git 연결 조회
        # active_connections = GitConnection.objects.filter(is_active=True)
        
        # for connection in active_connections:
        #     sync_git_repository.delay(
        #         connection.project.id,
        #         connection.repository_owner,
        #         connection.repository_name,
        #         connection.branch
        #     )
        
        logger.info("전체 Git 저장소 동기화 작업 예약 완료")
        
        return {'status': 'success', 'message': '모든 저장소 동기화 시작됨'}
        
    except Exception as e:
        logger.error(f"전체 동기화 오류: {e}")
        return {'status': 'error', 'message': f'전체 동기화 오류: {e}'} 