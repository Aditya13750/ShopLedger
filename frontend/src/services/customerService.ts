import api from './api';
import { ApiResponse, Customer, CustomerLedgerResponse } from '../types';

export interface CustomerQuery {
  search?: string;
  dueFilter?: 'all' | 'has_due' | 'zero_due';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const customerService = {
  async getCustomers(query: CustomerQuery = {}) {
    const res = await api.get<ApiResponse<Customer[]>>('/customers', { params: query });
    return res.data;
  },

  async getCustomerById(id: string) {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data;
  },

  async createCustomer(data: Partial<Customer>) {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data;
  },

  async updateCustomer(id: string, data: Partial<Customer>) {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data;
  },

  async deleteCustomer(id: string) {
    const res = await api.delete<ApiResponse>(`/customers/${id}`);
    return res.data;
  },

  async getCustomerLedger(id: string) {
    const res = await api.get<ApiResponse<CustomerLedgerResponse>>(`/customers/${id}/ledger`);
    return res.data;
  },

  async recalculateBalances(id: string) {
    const res = await api.post<ApiResponse<Customer>>(`/customers/${id}/recalculate`);
    return res.data;
  },
};
