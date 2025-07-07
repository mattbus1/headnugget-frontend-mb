import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserResponse, 
  APIError 
} from '../types/auth.types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle auth errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): APIError {
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as any;
      return {
        detail: errorData.detail || errorData.message || 'An error occurred',
        status_code: error.response.status,
      };
    }
    
    if (error.message) {
      return {
        detail: error.message,
        status_code: error.response?.status || 500,
      };
    }

    return {
      detail: 'An unexpected error occurred',
      status_code: 500,
    };
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      // Use form data for OAuth2 password flow as per PolicyStack spec
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await this.client.post<TokenResponse>('/api/auth/login', formData, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded' 
        }
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async register(userData: RegisterRequest): Promise<UserResponse> {
    try {
      const response = await this.client.post<UserResponse>('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await this.client.get<UserResponse>('/api/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Token management
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Retry mechanism for failed requests
  async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error as AxiosError)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private isRetryableError(error: AxiosError): boolean {
    // Don't retry auth errors or client errors
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }
    // Retry on network errors or server errors
    return !error.response || error.response.status >= 500;
  }
}

// Create singleton instance
const apiService = new APIService();

// Export authentication methods
export const authAPI = {
  login: (credentials: LoginRequest) => apiService.login(credentials),
  register: (userData: RegisterRequest) => apiService.register(userData),
  getCurrentUser: () => apiService.getCurrentUser(),
  healthCheck: () => apiService.healthCheck(),
  setToken: (token: string) => apiService.setAuthToken(token),
  removeToken: () => apiService.removeAuthToken(),
  getToken: () => apiService.getAuthToken(),
};

export default apiService;