import { apiClient } from './client';

export const analyticsApi = {
  async overall(userId) {
    const { data } = await apiClient.get(`/analytics/${userId}`);
    return data.data;
  },

  async weakTopics(userId) {
    const { data } = await apiClient.get(`/analytics/${userId}/weak-topics`);
    return data.data;
  },

  async retryQuiz(userId) {
    const { data } = await apiClient.get(`/analytics/${userId}/retry-quiz`);
    return data.data;
  },
};
