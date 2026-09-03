import api from './api';
import { ApiResponse, Bill } from '../types';

export interface BillQuery {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const billService = {
  async getBills(query: BillQuery = {}) {
    const res = await api.get<ApiResponse<Bill[]>>('/bills', { params: query });
    return res.data;
  },

  async getBillById(id: string) {
    const res = await api.get<ApiResponse<Bill>>(`/bills/${id}`);
    return res.data;
  },

  async createBill(data: any) {
    const res = await api.post<ApiResponse<Bill>>('/bills', data);
    return res.data;
  },

  async updateBill(id: string, data: any) {
    const res = await api.put<ApiResponse<Bill>>(`/bills/${id}`, data);
    return res.data;
  },

  async deleteBill(id: string) {
    const res = await api.delete<ApiResponse>(`/bills/${id}`);
    return res.data;
  },

  async uploadBillImage(billId: string, file: File) {
    const formData = new FormData();
    formData.append('billImage', file);
    const res = await api.post<ApiResponse<{ billId: string; billImage: any }>>(
      `/bills/${billId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  async sendWhatsAppBill(billId: string, recipientPhone?: string, customNote?: string) {
    const res = await api.post<ApiResponse>(`/bills/${billId}/send-whatsapp`, {
      recipientPhone,
      customNote,
    });
    return res.data;
  },
};
