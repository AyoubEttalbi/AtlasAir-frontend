import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, AuthResponse, LoginRequest, RegisterRequest } from '../services';
import { ApiError } from '../services/types/api.types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const token = authService.getToken();

        if (token && storedUser) {
          // Optionally verify token with backend
          // For now, just use stored user
          setUser(storedUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.login(credentials);
      authService.storeAuth(authResponse);
      setUser(authResponse.user);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        typeof apiError.message === 'string'
          ? apiError.message
          : apiError.message?.[0] || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.register(userData);
      authService.storeAuth(authResponse);
      setUser(authResponse.user);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        typeof apiError.message === 'string'
          ? apiError.message
          : apiError.message?.[0] || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    // Update stored user in localStorage
    const token = authService.getToken();
    if (token) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;


