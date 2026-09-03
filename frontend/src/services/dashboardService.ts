import api from './api';
import { ApiResponse } from '../types';

export const dashboardService = {
  async getSummary() {
    const res = await api.get<ApiResponse<any>>('/dashboard/summary');
    return res.data;
  },

  async getAnalytics() {
    const res = await api.get<ApiResponse<any>>('/dashboard/analytics');
    return res.data;
  },
};

export const settingsService = {
  async getSettings() {
    const res = await api.get<ApiResponse<any>>('/settings');
    return res.data;
  },

  async updateSettings(data: any) {
    const res = await api.put<ApiResponse<any>>('/settings', data);
    return res.data;
  },
};
