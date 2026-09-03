import api from './api';
import { ApiResponse, WhatsAppMessage } from '../types';

export const whatsappService = {
  async getHistory(query: {
    customerId?: string;
    messageType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const res = await api.get<ApiResponse<WhatsAppMessage[]>>('/whatsapp/history', { params: query });
    return res.data;
  },

  async sendBill(billId: string, recipientPhone?: string, customNote?: string) {
    const res = await api.post<ApiResponse<WhatsAppMessage>>('/whatsapp/send-bill', {
      billId,
      recipientPhone,
      customNote,
    });
    return res.data;
  },

  async sendReminder(customerId: string, customMessage?: string) {
    const res = await api.post<ApiResponse<WhatsAppMessage>>('/whatsapp/send-reminder', {
      customerId,
      customMessage,
    });
    return res.data;
  },
};
