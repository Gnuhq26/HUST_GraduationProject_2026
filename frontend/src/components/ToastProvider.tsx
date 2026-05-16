import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import React from 'react';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<ToastType, {
  icon: React.ComponentType<{ className?: string }>;
  containerClass: string;
  iconClass: string;
}> = {
  success: {
    icon: CheckCircle,
    containerClass: 'bg-basic-white border-l-4 border-accent-green',
    iconClass: 'text-accent-green',
  },
  error: {
    icon: XCircle,
    containerClass: 'bg-basic-white border-l-4 border-accent-red',
    iconClass: 'text-accent-red',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-basic-white border-l-4 border-yellowfish-400',
    iconClass: 'text-yellowfish-400',
  },
  info: {
    icon: Info,
    containerClass: 'bg-basic-white border-l-4 border-bluesh-800',
    iconClass: 'text-bluesh-800',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const cfg = toastConfig[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-basic-border min-w-72 max-w-sm animate-slide-in ${cfg.containerClass}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${cfg.iconClass}`} />
              <span className="flex-1 text-sm font-medium text-blacky-700">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
                className="text-blacky-300 hover:text-blacky-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
