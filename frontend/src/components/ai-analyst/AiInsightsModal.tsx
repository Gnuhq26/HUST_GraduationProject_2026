import { X } from 'lucide-react';
import Markdown from 'react-markdown';
import { aiMarkdownComponents } from './markdownComponents';
import { normalizeInsightsMarkdown } from './normalizeInsightsMarkdown';

interface AiInsightsModalProps {
  insights: string;
  generatedAt: Date;
  cached?: boolean;
  onClose: () => void;
}

export default function AiInsightsModal({
  insights,
  generatedAt,
  cached,
  onClose,
}: AiInsightsModalProps) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-bluesh-800">Phân tích từ AI</h2>
            <p className="text-sm text-blacky-500 mt-0.5">Lời khuyên kinh doanh dựa trên dữ liệu cửa hàng</p>
          </div>
            <button onClick={onClose} title="Đóng" className="text-bluesh-800 bg-bluesh-50 hover:text-basic-white hover:bg-bluesh-800 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
          <Markdown components={aiMarkdownComponents}>
            {normalizeInsightsMarkdown(insights)}
          </Markdown>
        </div>

        <div className="px-6 py-3 border-t border-yellowfish-400 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-yellowfish-500">
            Cập nhật lúc: {generatedAt.toLocaleString('vi-VN')}
          </p>
          {cached && (
            <span className="text-xs font-medium text-yellowfish-700 bg-yellowfish-50 border border-yellowfish-200 px-2 py-0.5 rounded-full">
              Dữ liệu cache
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
