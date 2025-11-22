import api from './api';
import {
  Reservation,
  CreateReservationRequest,
  ReservationStatus,
} from './types/api.types';

/**
 * Reservations Service
 * Handles reservation-related API calls
 */

export const reservationsService = {
  /**
   * Create a new reservation
   * @param reservationData - Reservation creation data
   * @returns Created reservation
   */
  async create(
    reservationData: CreateReservationRequest
  ): Promise<Reservation> {
    const response = await api.post<Reservation>(
      '/reservations',
      reservationData
    );
    return response.data;
  },

  /**
   * Get all reservations (user's own or all if admin)
   * @returns Array of reservations
   */
  async getAll(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/reservations');
    return response.data;
  },

  /**
   * Get reservation by ID
   * @param id - Reservation UUID
   * @returns Reservation object
   */
  async getById(id: string): Promise<Reservation> {
    const response = await api.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  /**
   * Update reservation
   * @param id - Reservation UUID
   * @param updateData - Partial reservation data to update
   * @returns Updated reservation
   */
  async update(
    id: string,
    updateData: Partial<CreateReservationRequest>
  ): Promise<Reservation> {
    const response = await api.patch<Reservation>(
      `/reservations/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Cancel reservation
   * @param id - Reservation UUID
   * @returns Cancelled reservation
   */
  async cancel(id: string): Promise<Reservation> {
    const response = await api.post<Reservation>(
      `/reservations/${id}/cancel`
    );
    return response.data;
  },

  /**
   * Delete reservation (Admin only)
   * @param id - Reservation UUID
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/reservations/${id}`);
  },

  /**
   * Get user's reservations
   * @returns Array of user's reservations
   */
  async getMyReservations(): Promise<Reservation[]> {
    return this.getAll(); // Backend filters by user automatically
  },
};

export default reservationsService;


