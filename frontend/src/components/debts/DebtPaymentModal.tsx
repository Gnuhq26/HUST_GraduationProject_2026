import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export interface PaymentModalData {
  type: 'customer' | 'supplier';
  referenceId: number;
  remaining: number;
}

interface DebtPaymentModalProps {
  paymentModal: PaymentModalData;
  paymentAmount: string;
  paymentNote: string;
  submitting: boolean;
  onClose: () => void;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'code',
  }).format(value);
};

export default function DebtPaymentModal({
  paymentModal,
  paymentAmount,
  paymentNote,
  submitting,
  onClose,
  onAmountChange,
  onNoteChange,
  onSubmit,
}: DebtPaymentModalProps) {
  const amount = parseFloat(paymentAmount);
  const hasInput = paymentAmount.trim() !== '';
  const isPositive = !isNaN(amount) && amount > 0;
  const withinLimit = !isNaN(amount) && amount <= paymentModal.remaining;
  const isValid = isPositive && withinLimit;

  let errorMessage: string | null = null;
  if (hasInput && !isPositive) {
    errorMessage = 'Số tiền phải lớn hơn 0';
  } else if (hasInput && !withinLimit) {
    errorMessage = `Số tiền vượt quá số còn nợ (${formatCurrency(paymentModal.remaining)})`;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-basic-white rounded-2xl overflow-hidden w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellowfish-400">
          <h2 className="text-xl font-bold text-blacky-950">Ghi nhận thanh toán</h2>
          <button
            onClick={onClose}
            title="Đóng"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bluesh-800 text-bluesh-800 hover:text-basic-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Số tiền thanh toán <span className="text-accent-red">*</span>
            </label>
            <p className="text-xs text-blacky-500 mb-1">
              Còn nợ:{' '}
              <span className="font-medium text-accent-red">
                {formatCurrency(paymentModal.remaining)}
              </span>
            </p>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors ${
                errorMessage
                  ? 'border-accent-red bg-accent-red/5 focus:border-accent-red'
                  : 'border-blacky-200 focus:border-bluesh-800 focus:bg-bluesh-50'
              }`}
              placeholder="Nhập số tiền..."
            />
            {errorMessage && (
              <p className="mt-1.5 text-xs font-medium text-accent-red flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-blacky-700 mb-1">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={paymentNote}
              onChange={(e) => onNoteChange(e.target.value)}
              className="w-full px-3 py-2 border border-blacky-200 rounded-lg focus:outline-none focus:border-bluesh-800 focus:bg-bluesh-50 transition-colors resize-none"
              placeholder="Ghi chú thanh toán..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 rounded-lg!"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="btn btn-primary flex-1 rounded-lg! disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
