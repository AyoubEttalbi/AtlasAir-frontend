/**
 * API Response Types
 * These types match the backend entity structures
 */

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export enum FlightClass {
  ECONOMY = 'ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Airport Types
export interface Airport {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Airline Types
export interface Airline {
  id: string;
  name: string;
  code: string;
  country?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Flight Types
export interface FlightResponse {
  id: string;
  flightNumber: string;
  airline: Airline;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  economyPrice: number;
  businessPrice: number;
  firstClassPrice: number;
  economySeats: number;
  businessSeats: number;
  firstClassSeats: number;
  availableEconomySeats: number;
  availableBusinessSeats: number;
  availableFirstClassSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Reservation Types
export interface Reservation {
  id: string;
  bookingReference: string;
  user: User;
  flight: FlightResponse;
  passengerFirstName: string;
  passengerLastName: string;
  passengerPassport: string;
  passengerDateOfBirth: string;
  flightClass: FlightClass;
  totalPrice: number;
  status: ReservationStatus;
  ticketPdfPath?: string;
  createdAt: string;
  updatedAt: string;
  payment?: Payment;
}

// Payment Types
export interface Payment {
  id: string;
  reservation: Reservation | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId: string;
  createdAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Flight Search Types
export interface SearchFlightRequest {
  departureAirportId: string;
  arrivalAirportId: string;
  departureDate: string;
  returnDate?: string;
  flightClass?: FlightClass;
  passengers?: number;
}

// Reservation Create Types
export interface CreateReservationRequest {
  flightId: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerPassport: string;
  passengerDateOfBirth: string;
  flightClass: FlightClass;
}

// Payment Create Types
export interface CreatePaymentRequest {
  reservationId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string; // MM/YY format
  cvv: string;
}

// API Error Response
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Generic API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Dashboard Statistics
export interface StatisticsDto {
  totalReservations: number;
  totalRevenue: number;
  totalUsers: number;
  totalFlights: number;
  activeReservations: number;
  cancelledReservations: number;
  completedReservations: number;
  pendingPayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  popularDestinations: Array<{ airport: string; count: number }>;
}


