import api from './api';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  email_verified?: boolean;
  role?: string;
  plaid_access_token?: string;
  business_name?: string;
  cac_number?: string;
  tin_number?: string;
  business_type?: string;
  country?: string;
  currency?: string;
}

export interface LoginCredentials {
  username: string; // email
  password: string;
}

export interface RegisterData {
  email: string;
  full_name: string;
  password: string;
}

export interface AuthMessage {
  message: string;
  email_sent?: boolean;
}

const ACCESS_TOKEN_COOKIE = 'access_token';

function cookieOptions() {
  // Match backend ACCESS_TOKEN_EXPIRE_MINUTES default (30).
  const minutes = 30;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  return {
    expires: minutes / (60 * 24),
    sameSite: 'strict' as const,
    secure,
    path: '/',
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData);
    const { access_token } = response.data;

    Cookies.set(ACCESS_TOKEN_COOKIE, access_token, cookieOptions());

    const userResponse = await api.get('/auth/me');

    return {
      user: userResponse.data,
      token: access_token,
    };
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async verifyEmail(token: string): Promise<AuthMessage> {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  async resendVerification(email: string): Promise<AuthMessage> {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<AuthMessage> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<AuthMessage> {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    Cookies.remove(ACCESS_TOKEN_COOKIE, { path: '/' });
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!Cookies.get(ACCESS_TOKEN_COOKIE);
  },

  isAdmin(user: User | null | undefined): boolean {
    return (user?.role || 'user') === 'admin';
  },
};
