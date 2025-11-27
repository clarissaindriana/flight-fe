import axios from 'axios'
import { getToken } from '@/lib/auth'

// Determine the correct API base URL
const getApiBaseUrl = (): string => {
  // First try environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // For production deployments, use current domain
  if (import.meta.env.PROD) {
    const origin = window.location.origin
    // Remove /fe path if present, and construct backend URL
    const hostname = window.location.hostname
    return `http://${hostname.replace('-fe.', '-be.')}/api`
  }
  
  // Default for local development
  return 'http://localhost:8080/api'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api