import api from './api';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
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

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData);
    const { access_token } = response.data;
    
    // Store token
    Cookies.set('access_token', access_token, { expires: 7 });
    
    // Get user info
    const userResponse = await api.get('/auth/me');
    
    return {
      user: userResponse.data,
      token: access_token
    };
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/auth/register', data);
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

  logout() {
    Cookies.remove('access_token');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }
};
