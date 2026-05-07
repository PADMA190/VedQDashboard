import { apiClient } from './client';

export const leaderboardApi = {
  async fetch(params = {}) {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const { data } = await apiClient.get('/leaderboard', { params: cleaned });
    return { items: data.data, meta: data.meta };
  },
};
