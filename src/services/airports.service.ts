import api from './api';
import { Airport } from './types/api.types';

/**
 * Airports Service
 * Handles airport-related API calls
 */

export const airportsService = {
  /**
   * Get all airports
   * @returns Array of airports
   */
  async getAll(): Promise<Airport[]> {
    const response = await api.get<Airport[]>('/airports');
    return response.data;
  },

  /**
   * Get airport by ID
   * @param id - Airport UUID
   * @returns Airport object
   */
  async getById(id: string): Promise<Airport> {
    const response = await api.get<Airport>(`/airports/${id}`);
    return response.data;
  },

  /**
   * Get airport by code (e.g., "JFK", "LAX")
   * Note: This may require a custom endpoint or filtering
   * @param code - Airport IATA code
   * @returns Airport object or null
   */
  async getByCode(code: string): Promise<Airport | null> {
    const airports = await this.getAll();
    return airports.find((airport) => airport.code === code) || null;
  },

  /**
   * Search airports by name or code
   * @param query - Search query
   * @returns Array of matching airports
   */
  async search(query: string): Promise<Airport[]> {
    const airports = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return airports.filter(
      (airport) =>
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Create airport (Admin only)
   * @param airportData - Airport creation data
   * @returns Created airport
   */
  async create(airportData: any): Promise<Airport> {
    const response = await api.post<Airport>('/airports', airportData);
    return response.data;
  },

  /**
   * Update airport (Admin only)
   * @param id - Airport UUID
   * @param airportData - Airport update data
   * @returns Updated airport
   */
  async update(id: string, airportData: any): Promise<Airport> {
    const response = await api.patch<Airport>(`/airports/${id}`, airportData);
    return response.data;
  },

  /**
   * Delete airport (Admin only)
   * @param id - Airport UUID
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/airports/${id}`);
  },
};

export default airportsService;


