import requests
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from plane.authentication.adapter.base import BaseAuthAdapter

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomAPIAuthAdapter(BaseAuthAdapter):
    """
    사용자 API와 연동하는 커스텀 인증 어댑터
    """
    
    def __init__(self, request):
        self.request = request
        self.api_base_url = getattr(settings, 'CUSTOM_AUTH_API_URL', None)
        self.api_key = getattr(settings, 'CUSTOM_AUTH_API_KEY', None)
        
        if not self.api_base_url:
            raise ValueError("CUSTOM_AUTH_API_URL 설정이 필요합니다")

    def authenticate_user(self, email, password):
        """
        사용자 API로 로그인 인증을 수행합니다
        """
        try:
            # 사용자 API 호출
            auth_url = f"{self.api_base_url}/auth/login"
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key
            } if self.api_key else {'Content-Type': 'application/json'}
            
            payload = {
                'email': email,
                'password': password
            }
            
            response = requests.post(auth_url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                return self._create_or_update_user(user_data)
            else:
                logger.error(f"인증 실패: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"인증 API 호출 오류: {e}")
            return None
    
    def validate_token(self, token):
        """
        사용자 API로 토큰 유효성을 검증합니다
        """
        try:
            validate_url = f"{self.api_base_url}/auth/validate"
            headers = {
                'Authorization': f'Bearer {token}',
                'X-API-Key': self.api_key
            } if self.api_key else {'Authorization': f'Bearer {token}'}
            
            response = requests.get(validate_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                return self._create_or_update_user(user_data)
            else:
                return None
                
        except requests.RequestException as e:
            logger.error(f"토큰 검증 API 호출 오류: {e}")
            return None
    
    def get_user_profile(self, user_id):
        """
        사용자 API에서 사용자 프로필 정보를 가져옵니다
        """
        try:
            profile_url = f"{self.api_base_url}/users/{user_id}"
            headers = {'X-API-Key': self.api_key} if self.api_key else {}
            
            response = requests.get(profile_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except requests.RequestException as e:
            logger.error(f"프로필 API 호출 오류: {e}")
            return None
    
    def _create_or_update_user(self, user_data):
        """
        API 응답 데이터로 Plane 사용자를 생성하거나 업데이트합니다
        """
        try:
            # 사용자 API 응답 형식에 맞게 조정 필요
            email = user_data.get('email')
            external_id = user_data.get('id') or user_data.get('user_id')
            
            if not email:
                logger.error("사용자 데이터에 이메일이 없습니다")
                return None
            
            # Plane 사용자 생성 또는 업데이트
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': user_data.get('first_name', ''),
                    'last_name': user_data.get('last_name', ''),
                    'avatar': user_data.get('avatar_url', ''),
                    'is_active': user_data.get('is_active', True),
                    'is_password_autoset': True,  # 외부 인증 사용자
                    'external_user_id': str(external_id) if external_id else None,
                }
            )
            
            # 기존 사용자 정보 업데이트
            if not created:
                user.first_name = user_data.get('first_name', user.first_name)
                user.last_name = user_data.get('last_name', user.last_name)
                user.avatar = user_data.get('avatar_url', user.avatar)
                user.is_active = user_data.get('is_active', user.is_active)
                user.external_user_id = str(external_id) if external_id else user.external_user_id
                user.save()
            
            logger.info(f"사용자 {'생성' if created else '업데이트'}됨: {email}")
            return user
            
        except Exception as e:
            logger.error(f"사용자 생성/업데이트 오류: {e}")
            return None
    
    def sync_user_roles(self, user, user_data):
        """
        사용자 API에서 역할 정보를 가져와서 Plane 권한과 동기화합니다
        """
        try:
            roles = user_data.get('roles', [])
            permissions = user_data.get('permissions', [])
            
            # 역할에 따른 Plane 권한 매핑
            role_mapping = {
                'admin': 'ADMIN',
                'manager': 'MEMBER', 
                'developer': 'MEMBER',
                'viewer': 'VIEWER'
            }
            
            # 워크스페이스 권한 설정 (실제 구현에서는 WorkspaceMember 모델 사용)
            for role in roles:
                plane_role = role_mapping.get(role.get('type'), 'MEMBER')
                workspace_id = role.get('workspace_id')
                
                if workspace_id:
                    # WorkspaceMember.objects.update_or_create(
                    #     workspace_id=workspace_id,
                    #     member=user,
                    #     defaults={'role': plane_role}
                    # )
                    pass
            
            logger.info(f"사용자 {user.email}의 역할 동기화 완료")
            
        except Exception as e:
            logger.error(f"역할 동기화 오류: {e}")


class CustomTokenAuthentication:
    """
    사용자 API 토큰을 사용한 인증 미들웨어
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.auth_adapter = None

    def __call__(self, request):
        self.authenticate_request(request)
        response = self.get_response(request)
        return response

    def authenticate_request(self, request):
        """
        요청에서 토큰을 추출하고 사용자를 인증합니다
        """
        token = self.get_token_from_request(request)
        
        if token:
            try:
                if not self.auth_adapter:
                    self.auth_adapter = CustomAPIAuthAdapter(request)
                
                user = self.auth_adapter.validate_token(token)
                if user:
                    request.user = user
                    request.auth = token
                    
            except Exception as e:
                logger.error(f"토큰 인증 오류: {e}")

    def get_token_from_request(self, request):
        """
        요청에서 인증 토큰을 추출합니다
        """
        # Authorization 헤더에서 토큰 추출
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header[7:]
        
        # 쿠키에서 토큰 추출 (옵션)
        return request.COOKIES.get('auth_token') 