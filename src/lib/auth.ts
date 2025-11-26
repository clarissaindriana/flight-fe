import api from '@/services/api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/interfaces/auth.interface';

const TOKEN_KEY = 'jwt_token';

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  const data = response.data;

  if (data.status === 200 && data.data?.token) {
    // Store token in localStorage for client-side use
    localStorage.setItem(TOKEN_KEY, data.data.token);
  }

  return data;
};

export const register = async (userData: RegisterRequest): Promise<any> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear token regardless of API response
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    // Basic JWT validation - check if not expired
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return false;
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.id || payload.userId,
      username: payload.sub || payload.username,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
};