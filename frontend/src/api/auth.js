import { apiClient } from './client';

export const authApi = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data.data;
  },

  async login(payload) {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data;
  },

  async refresh() {
    const { data } = await apiClient.post('/auth/refresh');
    return data.data;
  },

  async logout() {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  async me() {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user;
  },
};
