import { apiClient } from './client';

export const adminApi = {
  async dashboardStats() {
    const { data } = await apiClient.get('/admin/dashboard-stats');
    return data.data;
  },

  // Quizzes
  async createQuiz(payload) {
    const { data } = await apiClient.post('/admin/quizzes', payload);
    return data.data;
  },
  async updateQuiz(id, payload) {
    const { data } = await apiClient.put(`/admin/quizzes/${id}`, payload);
    return data.data;
  },
  async deleteQuiz(id) {
    await apiClient.delete(`/admin/quizzes/${id}`);
  },
  async assignQuiz(id, payload) {
    const { data } = await apiClient.post(`/admin/quizzes/${id}/assign`, payload);
    return data.data;
  },

  // Questions
  async listQuestions(params = {}) {
    const { data } = await apiClient.get('/admin/questions', { params });
    return { items: data.data, meta: data.meta };
  },
  async createQuestion(payload) {
    const { data } = await apiClient.post('/admin/questions', payload);
    return data.data;
  },
  async bulkCreateQuestions(items) {
    const { data } = await apiClient.post('/admin/questions/bulk', { items });
    return data.data;
  },
  async updateQuestion(id, payload) {
    const { data } = await apiClient.put(`/admin/questions/${id}`, payload);
    return data.data;
  },
  async deleteQuestion(id) {
    await apiClient.delete(`/admin/questions/${id}`);
  },

  // Users
  async listUsers(params = {}) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const { data } = await apiClient.get('/admin/users', { params: cleaned });
    return { items: data.data, meta: data.meta };
  },
};
