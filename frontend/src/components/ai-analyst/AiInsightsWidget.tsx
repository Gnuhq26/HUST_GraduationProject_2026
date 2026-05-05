import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import aiAnalystService from '../../services/aiAnalystService';
import type { AiInsightsResponse } from '@/types';

export default function AiInsightsWidget() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiAnalystService.getInsights() as AiInsightsResponse;
      setInsights(data.insights);
      setGeneratedAt(new Date(data.generatedAt));
    } catch (err: unknown) {
      console.error('AI Insights error:', err);
      setError('Không thể tải phân tích AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="text-lg font-semibold text-gray-900">AI Business Analyst</h3>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang phân tích...' : insights ? 'Phân tích lại' : 'Bắt đầu phân tích'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3 py-4">
          <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
          <p className="text-sm text-gray-400 mt-3">AI đang phân tích dữ liệu cửa hàng của bạn...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
          <FiAlertCircle className="text-red-500 text-xl shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchInsights}
              className="text-sm text-red-600 underline mt-1 hover:text-red-800"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Insights Content */}
      {!loading && !error && insights && (
        <div>
          <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-ul:my-2 prose-li:my-0.5">
            <Markdown>{insights}</Markdown>
          </div>
          {generatedAt && (
            <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
              Cập nhật lúc: {generatedAt.toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !insights && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-3">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-sm text-gray-500">
            Nhấn <strong>"Bắt đầu phân tích"</strong> để AI phân tích dữ liệu cửa hàng và đưa ra lời khuyên kinh doanh.
          </p>
        </div>
      )}
    </div>
  );
}
