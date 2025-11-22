import api from './api';
import {
  FlightResponse,
  SearchFlightRequest,
  FlightClass,
} from './types/api.types';
import { Flight } from '../shared/types';

// Export FlightResponse for admin pages
export type { FlightResponse };

/**
 * Flights Service
 * Handles flight-related API calls
 */

/**
 * Transform backend flight response to frontend Flight format
 */
const transformFlight = (flight: FlightResponse): Flight => {
  // Calculate duration string
  const hours = Math.floor(flight.durationMinutes / 60);
  const minutes = flight.durationMinutes % 60;
  const duration = `${hours}h ${minutes}m`;

  // Format time
  const departureDate = new Date(flight.departureTime);
  const time = departureDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Get price based on class (default to economy)
  // Note: You may want to pass the selected class as a parameter
  const basePrice = flight.economyPrice;
  const taxes = basePrice * 0.2; // Assuming 20% taxes
  const subtotal = basePrice - taxes;

  // Create stops array (simplified - backend has stops count)
  const stops: { name: string; duration: string }[] = [];
  // Note: Backend doesn't provide stop details, so this is a placeholder
  // You may need to enhance backend to provide stop information

  // Get airline logo path (assuming logos are stored in public/airlines/)
  const logo = flight.airline.logo
    ? flight.airline.logo
    : `/airlines/${flight.airline.name.replace(/\s+/g, '')}.svg`;

  return {
    id: flight.id,
    logo,
    airline: flight.airline.name,
    duration,
    time,
    stops,
    price: {
      subtotal: Math.round(subtotal * 100) / 100,
      taxes: Math.round(taxes * 100) / 100,
      total: Math.round(basePrice * 100) / 100,
    },
    flightType: 'round trip', // This should come from search params
    flightNumber: flight.flightNumber,
  };
};

export const flightsService = {
  /**
   * Search flights
   * @param searchParams - Flight search parameters
   * @returns Array of flights matching search criteria
   */
  async search(searchParams: SearchFlightRequest): Promise<Flight[]> {
    const response = await api.get<FlightResponse[]>('/flights/search', {
      params: searchParams,
    });
    return response.data.map(transformFlight);
  },

  /**
   * Get all flights
   * @returns Array of all flights
   */
  async getAll(): Promise<Flight[]> {
    const response = await api.get<FlightResponse[]>('/flights');
    return response.data.map(transformFlight);
  },

  /**
   * Get all flights as FlightResponse (for admin)
   * @returns Array of all flights with full details
   */
  async getAllRaw(): Promise<FlightResponse[]> {
    const response = await api.get<FlightResponse[]>('/flights');
    return response.data;
  },

  /**
   * Get flight by ID
   * @param id - Flight UUID
   * @returns Flight object
   */
  async getById(id: string): Promise<Flight> {
    const response = await api.get<FlightResponse>(`/flights/${id}`);
    return transformFlight(response.data);
  },

  /**
   * Get flight price for specific class
   * @param flightId - Flight UUID
   * @param flightClass - Flight class (ECONOMY, BUSINESS, FIRST)
   * @returns Price for the specified class
   */
  async getPrice(flightId: string, flightClass: FlightClass): Promise<number> {
    const flight = await this.getById(flightId);
    const flightResponse = await api.get<FlightResponse>(`/flights/${flightId}`);
    const data = flightResponse.data;

    switch (flightClass) {
      case FlightClass.ECONOMY:
        return data.economyPrice;
      case FlightClass.BUSINESS:
        return data.businessPrice;
      case FlightClass.FIRST:
        return data.firstClassPrice;
      default:
        return data.economyPrice;
    }
  },

  /**
   * Create flight (Admin only)
   * @param flightData - Flight creation data
   * @returns Created flight
   */
  async create(flightData: any): Promise<FlightResponse> {
    const response = await api.post<FlightResponse>('/flights', flightData);
    return response.data;
  },

  /**
   * Update flight (Admin only)
   * @param id - Flight UUID
   * @param flightData - Flight update data
   * @returns Updated flight
   */
  async update(id: string, flightData: any): Promise<FlightResponse> {
    const response = await api.patch<FlightResponse>(`/flights/${id}`, flightData);
    return response.data;
  },

  /**
   * Delete flight (Admin only)
   * @param id - Flight UUID
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/flights/${id}`);
  },
};

export default flightsService;


