import api from './api';
import { StatisticsDto } from './types/api.types';

/**
 * Dashboard Service
 * Handles admin dashboard statistics
 */

export const dashboardService = {
  /**
   * Get dashboard statistics (Admin only)
   * @returns Dashboard statistics
   */
  async getStatistics(): Promise<StatisticsDto> {
    const response = await api.get<StatisticsDto>('/dashboard/statistics');
    return response.data;
  },
};

export default dashboardService;

