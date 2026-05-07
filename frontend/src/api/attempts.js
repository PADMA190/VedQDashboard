import { apiClient } from './client';

export const attemptsApi = {
  async submit(payload) {
    const { data } = await apiClient.post('/attempts', payload);
    return data.data;
  },

  async listMine(params = {}) {
    const { data } = await apiClient.get('/attempts/me', { params });
    return { items: data.data, meta: data.meta };
  },

  async detail(id) {
    const { data } = await apiClient.get(`/attempts/${id}`);
    return data.data;
  },
};
