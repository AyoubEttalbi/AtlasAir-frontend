import api from './api';
import { User } from './types/api.types';

/**
 * Users Service
 * Handles user management (Admin only)
 */

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'ADMIN' | 'CLIENT';
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'ADMIN' | 'CLIENT';
  isActive?: boolean;
}

export const usersService = {
  /**
   * Get all users (Admin only)
   * @returns Array of users
   */
  async getAll(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  /**
   * Get user by ID
   * @param id - User UUID
   * @returns User object
   */
  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create user (Admin only)
   * @param userData - User creation data
   * @returns Created user
   */
  async create(userData: CreateUserRequest): Promise<User> {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  /**
   * Update user
   * @param id - User UUID
   * @param userData - User update data
   * @returns Updated user
   */
  async update(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete user (Admin only)
   * @param id - User UUID
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

export default usersService;

