export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  gender: 'Male' | 'Female';
  role: 'Customer' | 'Flight Airline' | 'Superadmin';
}

export interface LoginResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface BaseResponse<T> {
  status: number;
  message: string;
  data: T;
  timestamp: string;
}

export type AuthResponse = BaseResponse<LoginResponse>;