import api from './api';
import { Airline } from './types/api.types';

/**
 * Airlines Service
 * Handles airline-related API calls
 */

export const airlinesService = {
  /**
   * Get all airlines
   * @returns Array of airlines
   */
  async getAll(): Promise<Airline[]> {
    const response = await api.get<Airline[]>('/airlines');
    return response.data;
  },

  /**
   * Get airline by ID
   * @param id - Airline UUID
   * @returns Airline object
   */
  async getById(id: string): Promise<Airline> {
    const response = await api.get<Airline>(`/airlines/${id}`);
    return response.data;
  },

  /**
   * Get airline by code
   * @param code - Airline IATA code
   * @returns Airline object or null
   */
  async getByCode(code: string): Promise<Airline | null> {
    const airlines = await this.getAll();
    return airlines.find((airline) => airline.code === code) || null;
  },

  /**
   * Create airline (Admin only)
   * @param airlineData - Airline creation data
   * @returns Created airline
   */
  async create(airlineData: any): Promise<Airline> {
    const response = await api.post<Airline>('/airlines', airlineData);
    return response.data;
  },

  /**
   * Update airline (Admin only)
   * @param id - Airline UUID
   * @param airlineData - Airline update data
   * @returns Updated airline
   */
  async update(id: string, airlineData: any): Promise<Airline> {
    const response = await api.patch<Airline>(`/airlines/${id}`, airlineData);
    return response.data;
  },

  /**
   * Delete airline (Admin only)
   * @param id - Airline UUID
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/airlines/${id}`);
  },
};

export default airlinesService;


