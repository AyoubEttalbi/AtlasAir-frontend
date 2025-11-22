import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './types/api.types';

/**
 * Base API configuration
 * Creates an Axios instance with interceptors for authentication and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    // Only add token if it exists and is valid
    if (token && config.headers) {
      try {
        // Basic token validation - check if it's not empty and has proper format
        if (token.trim().length > 0) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // If token is invalid, remove it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle network errors
    if (!error.response) {
      const networkError: ApiError = {
        statusCode: 0,
        message: 'Network error. Please check your internet connection.',
        error: 'Network Error',
      };
      return Promise.reject(networkError);
    }

    // Handle HTTP errors
    const { status, data } = error.response;

    // Handle 401 Unauthorized - Clear token and redirect to login
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page (you can customize this)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - This might indicate an invalid token
    // Clear token and retry the request without it for public routes
    if (status === 403) {
      const token = localStorage.getItem('token');
      if (token) {
        // Check if token is expired or invalid
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            // If token is expired, remove it
            if (payload.exp && payload.exp < now) {
              console.warn('Token expired, clearing...');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Retry the request without token if it's a GET request (likely public)
              if (error.config?.method?.toLowerCase() === 'get') {
                // Remove Authorization header and retry
                const newConfig = { ...error.config };
                if (newConfig.headers) {
                  delete newConfig.headers.Authorization;
                }
                return axios.request(newConfig);
              }
            }
          }
        } catch (error) {
          // If token is malformed, remove it
          console.warn('Invalid token format, clearing...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }

    // Format error response
    const apiError: ApiError = {
      statusCode: status,
      message: data?.message || error.message || 'An error occurred',
      error: data?.error || error.message,
    };

    return Promise.reject(apiError);
  }
);

export default api;


