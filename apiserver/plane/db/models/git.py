from django.db import models
from django.contrib.postgres.fields import JSONField

from .base import BaseModel
from .project import Project
from .user import User


class GitRepository(BaseModel):
    """
    프로젝트에 연결된 Git 저장소 정보를 저장하는 모델
    """
    project = models.OneToOneField(
        Project, 
        on_delete=models.CASCADE, 
        related_name="git_repository"
    )
    repository_url = models.URLField(max_length=500)
    repository_name = models.CharField(max_length=200)
    repository_owner = models.CharField(max_length=100)
    default_branch = models.CharField(max_length=100, default="main")
    access_token = models.TextField(blank=True, null=True)  # 암호화 필요
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', '대기중'),
            ('SYNCING', '동기화중'),
            ('COMPLETED', '완료'),
            ('FAILED', '실패'),
        ],
        default='PENDING'
    )
    sync_error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = "git_repositories"
        verbose_name = "Git 저장소"
        verbose_name_plural = "Git 저장소들"


class GitCommit(BaseModel):
    """
    Git 커밋 정보를 저장하는 모델
    """
    repository = models.ForeignKey(
        GitRepository, 
        on_delete=models.CASCADE, 
        related_name="commits"
    )
    sha = models.CharField(max_length=40, unique=True)  # Git SHA
    commit_message = models.TextField()
    author_name = models.CharField(max_length=100)
    author_email = models.EmailField()
    author_date = models.DateTimeField()
    committer_name = models.CharField(max_length=100)
    committer_email = models.EmailField()
    committer_date = models.DateTimeField()
    
    # GitHub 사용자 정보 (있는 경우)
    github_author_login = models.CharField(max_length=100, blank=True, null=True)
    github_author_avatar = models.URLField(blank=True, null=True)
    
    # 커밋 상세 정보
    tree_sha = models.CharField(max_length=40)
    parent_shas = JSONField(default=list)  # 부모 커밋들의 SHA 리스트
    comment_count = models.IntegerField(default=0)
    
    # URL 정보
    commit_url = models.URLField()
    html_url = models.URLField()
    
    # 추가 메타데이터
    files_changed = models.IntegerField(default=0)
    additions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)
    
    class Meta:
        db_table = "git_commits"
        verbose_name = "Git 커밋"
        verbose_name_plural = "Git 커밋들"
        ordering = ['-author_date']
        indexes = [
            models.Index(fields=['repository', '-author_date']),
            models.Index(fields=['sha']),
            models.Index(fields=['author_email']),
        ]


class GitBranch(BaseModel):
    """
    Git 브랜치 정보를 저장하는 모델
    """
    repository = models.ForeignKey(
        GitRepository, 
        on_delete=models.CASCADE, 
        related_name="branches"
    )
    name = models.CharField(max_length=200)
    commit_sha = models.CharField(max_length=40)
    is_protected = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        db_table = "git_branches"
        verbose_name = "Git 브랜치"
        verbose_name_plural = "Git 브랜치들"
        unique_together = ['repository', 'name']


class GitSyncHistory(BaseModel):
    """
    Git 동기화 이력을 저장하는 모델
    """
    repository = models.ForeignKey(
        GitRepository, 
        on_delete=models.CASCADE, 
        related_name="sync_history"
    )
    sync_type = models.CharField(
        max_length=20,
        choices=[
            ('FULL', '전체 동기화'),
            ('INCREMENTAL', '증분 동기화'),
            ('MANUAL', '수동 동기화'),
        ],
        default='INCREMENTAL'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('STARTED', '시작'),
            ('COMPLETED', '완료'),
            ('FAILED', '실패'),
        ]
    )
    commits_synced = models.IntegerField(default=0)
    sync_duration = models.DurationField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    synced_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="git_syncs"
    )
    
    class Meta:
        db_table = "git_sync_history"
        verbose_name = "Git 동기화 이력"
        verbose_name_plural = "Git 동기화 이력들"
        ordering = ['-created_at'] 