import api from './api';
import { ApiResponse } from '../types';

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
