import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from './types/api.types';

/**
 * Authentication Service
 * Handles login, register, and user-related API calls
 */

export const authService = {
  /**
   * Login user
   * @param credentials - Login credentials (email and password)
   * @returns Auth response with access token and user data
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   * @param userData - User registration data
   * @returns Auth response with access token and user data
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  /**
   * Get current user (if token is valid)
   * Note: This endpoint may not exist in backend, but can be added
   * @returns Current user data
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout user (clears local storage)
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   * @returns true if token exists
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored token
   * @returns JWT token or null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Store authentication data
   * @param authResponse - Auth response from login/register
   */
  storeAuth(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.access_token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  },

  /**
   * Get stored user data
   * @returns User object or null
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

export default authService;


