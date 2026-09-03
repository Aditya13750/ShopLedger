import api from './api';
import { ApiResponse, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: { token: string; newPassword: string }) {
    const res = await api.post<ApiResponse>('/auth/reset-password', data);
    return res.data;
  },
};
