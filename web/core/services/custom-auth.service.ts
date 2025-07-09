import { APIService } from "@/services/api.service";

// 사용자 API 응답 타입 정의
interface ICustomAuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    roles?: Array<{
      type: string;
      workspace_id?: string;
    }>;
  };
  token: string;
  refresh_token?: string;
}

interface ILoginCredentials {
  email: string;
  password: string;
}

export class CustomAuthService {
  private apiBaseUrl: string;
  private apiKey?: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_CUSTOM_AUTH_API_URL || "";
    this.apiKey = process.env.NEXT_PUBLIC_CUSTOM_AUTH_API_KEY;
  }

  /**
   * 사용자 API로 로그인을 수행합니다
   */
  async login(credentials: ILoginCredentials): Promise<ICustomAuthResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다');
      }

      const data = await response.json();
      
      // 토큰을 로컬 스토리지에 저장
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
      }

      return data;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  }

  /**
   * 토큰 유효성을 검증합니다
   */
  async validateToken(token?: string): Promise<ICustomAuthResponse['user'] | null> {
    try {
      const authToken = token || localStorage.getItem('auth_token');
      
      if (!authToken) {
        return null;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`,
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/validate`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        // 토큰이 유효하지 않은 경우 로컬 스토리지에서 제거
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        return null;
      }

      const data = await response.json();
      return data.user || data;
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      return null;
    }
  }

  /**
   * 로그아웃을 수행합니다
   */
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${token}`,
        };
        
        if (this.apiKey) {
          headers['X-API-Key'] = this.apiKey;
        }

        // 서버에 로그아웃 요청 (옵션)
        await fetch(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers,
        });
      }
    } catch (error) {
      console.error('로그아웃 API 오류:', error);
    } finally {
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  /**
   * 토큰을 새로고침합니다
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return null;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        return null;
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        return data.token;
      }

      return null;
    } catch (error) {
      console.error('토큰 새로고침 오류:', error);
      return null;
    }
  }

  /**
   * 현재 저장된 토큰을 반환합니다
   */
  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * 사용자 프로필 정보를 가져옵니다
   */
  async getUserProfile(userId: string): Promise<ICustomAuthResponse['user'] | null> {
    try {
      const token = this.getStoredToken();
      
      if (!token) {
        return null;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스 export
export const customAuthService = new CustomAuthService(); 