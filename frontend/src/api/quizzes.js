import { apiClient } from './client';

export const quizzesApi = {
  async list(params = {}) {
    const { data } = await apiClient.get('/quizzes', { params });
    return { items: data.data, meta: data.meta };
  },

  async detail(id) {
    const { data } = await apiClient.get(`/quizzes/${id}`);
    return data.data;
  },
};
