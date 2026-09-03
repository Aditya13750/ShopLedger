import api from './api';
import { ApiResponse, Payment } from '../types';

export interface PaymentQuery {
  customerId?: string;
  billId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const paymentService = {
  async getPayments(query: PaymentQuery = {}) {
    const res = await api.get<ApiResponse<Payment[]>>('/payments', { params: query });
    return res.data;
  },

  async recordPayment(data: {
    customer: string;
    bill?: string;
    amount: number;
    paymentDate?: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const res = await api.post<ApiResponse<Payment>>('/payments', data);
    return res.data;
  },

  async deletePayment(id: string) {
    const res = await api.delete<ApiResponse>(`/payments/${id}`);
    return res.data;
  },
};
