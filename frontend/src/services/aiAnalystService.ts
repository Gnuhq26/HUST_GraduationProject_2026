import apiClient from './api';
import type { AiInsightsResponse } from '@/types';

const aiAnalystService = {
  async getInsights(options?: { refresh?: boolean }): Promise<AiInsightsResponse> {
    const response = await apiClient.get<AiInsightsResponse>('/ai-analyst/insights', {
      params: options?.refresh ? { refresh: 'true' } : undefined,
    });
    return response.data;
  },
};

export default aiAnalystService;
