import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * トースト通知コンポーネント
 * 
 * @param {ToastType} type - 通知タイプ（success, error, warning, info）
 * @param {string} message - 表示メッセージ
 * @param {number} duration - 表示時間（ミリ秒、デフォルト: 3000）
 * @param {() => void} onClose - 閉じる時のコールバック
 * @param {object} action - アクションボタン（オプション）
 */
export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
  action,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg border-l-4 ${typeStyles[type]} p-4 animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-semibold underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
