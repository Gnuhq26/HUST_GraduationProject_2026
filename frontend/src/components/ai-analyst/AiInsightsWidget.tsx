import { useState, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, Eye, Sparkles } from 'lucide-react';
import aiAnalystService from '../../services/aiAnalystService';
import AiInsightsModal from './AiInsightsModal';
import { extractInsightsTeaser } from './extractInsightsTeaser';
import type { AiInsightsResponse } from '@/types';

export default function AiInsightsWidget() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [cached, setCached] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  const fetchInsights = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = (await aiAnalystService.getInsights({ refresh })) as AiInsightsResponse;
      setInsights(data.insights);
      setGeneratedAt(new Date(data.generatedAt));
      setCached(Boolean(data.cached));

      if (!hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setModalOpen(true);
      } else {
        setModalOpen(false);
      }
    } catch (err: unknown) {
      console.error('AI Insights error:', err);
      setError('Không thể tải phân tích AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = () => fetchInsights(false);
  const handleRefresh = () => fetchInsights(true);

  const teaser = insights ? extractInsightsTeaser(insights) : null;

  return (
    <>
      <div className="bg-basic-white rounded-xl border border-basic-border2 p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-semibold text-blacky-950">AI Business Analyst</h3>
          <button
            type="button"
            onClick={insights ? handleRefresh : handleStart}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-bluesh-800 bg-bluesh-50 border border-bluesh-800 rounded-lg hover:bg-bluesh-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Đang phân tích...' : insights ? 'Phân tích lại' : 'Bắt đầu phân tích'}
          </button>
        </div>

        {loading && (
          <div className="space-y-3 py-4">
            <div className="h-4 w-3/4 bg-blacky-100 animate-pulse rounded" />
            <div className="h-4 w-full bg-blacky-100 animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-blacky-100 animate-pulse rounded" />
            <p className="text-sm text-blacky-400 mt-3">AI đang phân tích dữ liệu cửa hàng của bạn...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 p-4 bg-accent-red/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-accent-red">{error}</p>
              <button
                type="button"
                onClick={handleStart}
                className="text-sm text-accent-red underline mt-1 hover:opacity-75 transition-opacity"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {!loading && !error && insights && teaser && (
          <div className="space-y-4">
            <p className="text-sm text-blacky-700 leading-relaxed">{teaser}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-bluesh-800 border border-bluesh-800 rounded-lg hover:bg-bluesh-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem chi tiết
              </button>
              {generatedAt && (
                <p className="text-xs text-blacky-400">
                  Cập nhật: {generatedAt.toLocaleString('vi-VN')}
                  {cached ? ' (cache)' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && !error && !insights && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-bluesh-50 rounded-full mb-3">
              <Sparkles className="w-7 h-7 text-bluesh-800" />
            </div>
            <p className="text-sm text-blacky-500">
              Nhấn <strong>&quot;Bắt đầu phân tích&quot;</strong> để AI phân tích dữ liệu cửa hàng và đưa ra lời
              khuyên kinh doanh chi tiết.
            </p>
          </div>
        )}
      </div>

      {modalOpen && insights && generatedAt && (
        <AiInsightsModal
          insights={insights}
          generatedAt={generatedAt}
          cached={cached}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
