/**
 * Services Index
 * Central export for all API services
 */

export { default as api } from './api';
export { default as authService } from './auth.service';
export { default as airportsService } from './airports.service';
export { default as airlinesService } from './airlines.service';
export { default as flightsService } from './flights.service';
export { default as reservationsService } from './reservations.service';
export { default as paymentsService } from './payments.service';
export { default as ticketsService } from './tickets.service';
export { default as notificationsService } from './notifications.service';
export { default as dashboardService } from './dashboard.service';
export { default as usersService } from './users.service';
export { default as passengerProfilesService } from './passenger-profiles.service';

// Export types
export * from './types/api.types';
export * from './users.service';
export * from './passenger-profiles.service';


