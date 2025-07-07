// Authentication and User Management Types
// Based on PolicyStack RhythmRisk 2.0 API specification

export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  max_documents_per_month: number;
  documents_processed_this_month: number;
  billing_email?: string;
}

// Authentication request/response interfaces
export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  is_active: boolean;
  is_superuser?: boolean;
  created_at?: string;
  updated_at?: string;
}

// API Error interface
export interface APIError {
  detail: string;
  status_code: number;
}

// Form data interfaces
export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  organization_name: string;
  terms: boolean;
}

export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_name?: string;
  organization_name?: string;
  terms?: string;
}

// Authentication context interface
export interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Storage keys for persisted data
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  userData: 'user_data',
} as const;