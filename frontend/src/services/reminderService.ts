import api from './api';
import { ApiResponse, ReminderLog } from '../types';

export const reminderService = {
  async getReminderLogs(query: { customerId?: string; status?: string; page?: number; limit?: number } = {}) {
    const res = await api.get<ApiResponse<ReminderLog[]>>('/reminders', { params: query });
    return res.data;
  },

  async sendManualReminder(customerId: string) {
    const res = await api.post<ApiResponse<ReminderLog>>('/reminders/send', { customerId });
    return res.data;
  },

  async triggerAutomatedNow() {
    const res = await api.post<ApiResponse<any>>('/reminders/trigger-auto');
    return res.data;
  },
};
