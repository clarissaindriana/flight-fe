import axios from 'axios'
import { getToken } from '@/lib/auth'

// Determine the correct API base URL for flight service
const getFlightApiBaseUrl = (): string => {
  // First try environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // For production deployments, use current domain
  if (import.meta.env.PROD) {
    const hostname = window.location.hostname
    return `http://${hostname.replace('-fe.', '-be.')}/api`
  }
  
  // Default for local development
  return 'http://localhost:8080/api'
}

// Auth API uses friend's backend
const getAuthApiBaseUrl = (): string => {
  // First try environment variable
  if (import.meta.env.VITE_AUTH_API_BASE_URL) {
    return import.meta.env.VITE_AUTH_API_BASE_URL
  }
  
  // Default to friend's profile service
  return 'http://2306219575-be.hafizmuh.site/api'
}

const api = axios.create({
  baseURL: getFlightApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate axios instance for auth API
const authApi = axios.create({
  baseURL: getAuthApiBaseUrl(),
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

// Auth API interceptor - add token if available
authApi.interceptors.request.use(
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

// Auth API response interceptor
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { authApi }
export default api