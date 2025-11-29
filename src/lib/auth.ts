import api, { authApi } from '@/services/api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/interfaces/auth.interface';

const TOKEN_KEY = 'jwt_token';

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<AuthResponse>('/auth/login', credentials);
    const data = response.data;

    if (data.status === 200 && data.data?.token) {
      // Store token in localStorage for client-side use
      localStorage.setItem(TOKEN_KEY, data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: RegisterRequest): Promise<any> => {
  const response = await authApi.post('/auth/register', userData);
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

/**
 * Determine whether the user is considered authenticated on the frontend.
 *
 * We primarily rely on the presence of a token. If the JWT contains a standard
 * `exp` claim, we additionally ensure it has not expired. This makes the
 * frontend tolerant to tokens without `exp` while still correctly handling
 * expiry when available.
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
      // Non-standard token format but present – treat as authenticated.
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));

    // If backend does not include exp, consider token valid as long as it exists.
    if (!payload.exp) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    // On any decoding error, fall back to presence-based auth to avoid blocking UI.
    return true;
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