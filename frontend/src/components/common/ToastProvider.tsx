import React from 'react';
import { Toast } from './Toast';
import { useToast } from '@/hooks/useToast';

interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * トースト通知プロバイダー
 * アプリケーション全体でトースト通知を管理
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toasts, hideToast } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
            action={toast.action}
          />
        ))}
      </div>
    </>
  );
};
