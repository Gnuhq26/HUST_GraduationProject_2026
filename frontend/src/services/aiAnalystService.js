import apiClient from './api';

const aiAnalystService = {
  async getInsights() {
    const response = await apiClient.get('/ai-analyst/insights');
    return response.data;
  },
};

export default aiAnalystService;
