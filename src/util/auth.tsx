import { authService } from '../services';

/**
 * Auth Utilities
 * Legacy compatibility - use AuthContext for new code
 */

export const getAuth = () => {
  return authService.getToken();
};

export const isAuthenticated = () => {
  return authService.isAuthenticated();
};

export const getStoredUser = () => {
  return authService.getStoredUser();
};
