import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import React from 'react';
export type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-50',
    iconColor: 'text-accent-red',
    confirmClass: 'btn bg-accent-red! text-white! hover:opacity-90 flex-1 rounded-lg!',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellowfish-50',
    iconColor: 'text-yellowfish-500',
    confirmClass: 'btn bg-yellowfish-500! text-white! hover:opacity-90 flex-1 rounded-lg!',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-bluesh-50',
    iconColor: 'text-bluesh-800',
    confirmClass: 'btn btn-primary flex-1 rounded-lg!',
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-blacky-950/30 flex items-center justify-center z-50 p-4">
      <div className="bg-basic-white rounded-2xl border border-basic-border shadow-lg w-full max-w-sm">
        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${config.iconBg}`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blacky-950 mb-1">{title}</h3>
            <p className="text-sm text-blacky-500">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-center">
          <button type="button" onClick={onCancel} className="btn btn-secondary w-[40%]! rounded-lg!">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`w-[40%]! ${config.confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
