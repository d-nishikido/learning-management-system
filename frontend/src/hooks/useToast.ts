import { useState, useCallback } from 'react';
import type { ToastType } from '@/components/common/Toast';

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast extends ToastOptions {
  id: string;
}

interface UseToastReturn {
  toasts: Toast[];
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, action?: { label: string; onClick: () => void }) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

/**
 * トースト通知管理のためのカスタムフック
 */
export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...options, id };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration: number = 3000) => {
      showToast({ type: 'success', message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      showToast({ type: 'error', message, duration: 0, action });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration: number = 3000) => {
      showToast({ type: 'warning', message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration: number = 3000) => {
      showToast({ type: 'info', message, duration });
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
