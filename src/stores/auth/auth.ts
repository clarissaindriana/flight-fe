import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/interfaces/auth.interface';
import { login, register, logout, isAuthenticated, getCurrentUser } from '@/lib/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => isAuthenticated());
  const currentUser = computed(() => user.value || getCurrentUser());

  const initializeAuth = () => {
    if (isAuthenticated()) {
      user.value = getCurrentUser();
    }
  };

  const loginUser = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await login({ email, password });
      if (response.status === 200 && response.data) {
        user.value = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          name: response.data.name,
          role: response.data.role,
        };
        return { success: true };
      } else {
        error.value = response.message || 'Login failed';
        return { success: false, message: error.value };
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      error.value = message;
      console.error('Login failed:', message, err);
      return { success: false, message: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const registerUser = async (userData: {
    username: string;
    name: string;
    email: string;
    password: string;
    gender: 'Male' | 'Female';
    role: 'Customer' | 'Flight Airline' | 'Superadmin';
  }) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await register(userData);
      return { success: true, data: response };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed';
      return { success: false, message: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  const logoutUser = async () => {
    isLoading.value = true;
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      error.value = null;
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    currentUser,
    initializeAuth,
    loginUser,
    registerUser,
    logoutUser,
    clearError,
  };
});