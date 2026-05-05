import apiClient from './api';
import type { AiInsightsResponse } from '@/types';

const aiAnalystService = {
  async getInsights(): Promise<AiInsightsResponse> {
    const response = await apiClient.get<AiInsightsResponse>('/ai-analyst/insights');
    return response.data;
  },
};

export default aiAnalystService;
