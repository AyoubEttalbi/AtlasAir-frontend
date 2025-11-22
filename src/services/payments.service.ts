import api from './api';
import { Payment, CreatePaymentRequest, PaymentStatus } from './types/api.types';

/**
 * Payments Service
 * Handles payment-related API calls
 */

export const paymentsService = {
  /**
   * Create a new payment
   * @param paymentData - Payment creation data
   * @returns Created payment
   */
  async create(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await api.post<Payment>('/payments', paymentData);
    return response.data;
  },

  /**
   * Get all payments (Admin only)
   * @returns Array of payments
   */
  async getAll(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data;
  },

  /**
   * Get payment by ID
   * @param id - Payment UUID
   * @returns Payment object
   */
  async getById(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  /**
   * Update payment status (Admin only)
   * @param id - Payment UUID
   * @param status - New payment status
   * @returns Updated payment
   */
  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}/status`, {
      status,
    });
    return response.data;
  },
};

export default paymentsService;


