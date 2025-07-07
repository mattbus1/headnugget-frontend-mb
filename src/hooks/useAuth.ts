import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import type { 
  UserResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthContextType
} from '../types/auth.types';

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authAPI.getToken();
        const storedUser = localStorage.getItem('user_data');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by fetching current user
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user_data', JSON.stringify(currentUser));
          } catch (error) {
            // Token is invalid, clear auth state
            console.warn('Token validation failed:', error);
            authAPI.removeToken();
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authAPI.removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get token
      const tokenResponse = await authAPI.login(credentials);
      authAPI.setToken(tokenResponse.access_token);
      setToken(tokenResponse.access_token);

      // Get user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));

    } catch (error) {
      // Clean up on login failure
      authAPI.removeToken();
      setToken(null);
      setUser(null);
      throw error; // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Register user
      await authAPI.register(userData);
      
      // Auto-login after registration
      await login({
        username: userData.email,
        password: userData.password
      });

    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw for component to handle
    }
  }, [login]);

  const logout = useCallback((): void => {
    authAPI.removeToken();
    setToken(null);
    setUser(null);
    
    // Redirect to login page
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (!token) {
        throw new Error('No authentication token available');
      }

      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, logout user
      logout();
      throw error;
    }
  }, [token, logout]);

  const isAuthenticated = Boolean(token && user);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };
};