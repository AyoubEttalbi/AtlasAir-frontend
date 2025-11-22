import api from './api';

export interface PassengerProfile {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  redressNumber?: string;
  knownTravelerNumber?: string;
  passportNumber: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassengerProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  redressNumber?: string;
  knownTravelerNumber?: string;
  passportNumber: string;
  isDefault?: boolean;
}

export interface EmergencyContactProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const passengerProfilesService = {
  /**
   * Get all passenger profiles for the current user
   */
  async getAll(): Promise<PassengerProfile[]> {
    const response = await api.get<PassengerProfile[]>('/passenger-profiles');
    return response.data;
  },

  /**
   * Get default passenger profile
   */
  async getDefault(): Promise<PassengerProfile | null> {
    try {
      const response = await api.get<PassengerProfile>('/passenger-profiles/default');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get passenger profile by ID
   */
  async getById(id: string): Promise<PassengerProfile> {
    const response = await api.get<PassengerProfile>(`/passenger-profiles/${id}`);
    return response.data;
  },

  /**
   * Create a new passenger profile
   */
  async create(profile: CreatePassengerProfileRequest): Promise<PassengerProfile> {
    const response = await api.post<PassengerProfile>('/passenger-profiles', profile);
    return response.data;
  },

  /**
   * Update passenger profile
   */
  async update(id: string, profile: Partial<CreatePassengerProfileRequest>): Promise<PassengerProfile> {
    const response = await api.patch<PassengerProfile>(`/passenger-profiles/${id}`, profile);
    return response.data;
  },

  /**
   * Delete passenger profile
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/passenger-profiles/${id}`);
  },
};

export default passengerProfilesService;

