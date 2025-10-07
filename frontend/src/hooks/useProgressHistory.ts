import { useState, useEffect } from 'react';
import { progressApi } from '@/services/api';
import type { ProgressHistoryEntry } from '@/types';

interface UseProgressHistoryReturn {
  history: ProgressHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 進捗履歴取得のためのカスタムフック
 * 
 * @param {number} materialId - 教材ID
 * @param {boolean} enabled - 自動取得を有効にするか（デフォルト: true）
 * @returns {UseProgressHistoryReturn} 履歴データ、ローディング状態、エラー状態、再取得関数
 */
export const useProgressHistory = (
  materialId: number,
  enabled: boolean = true
): UseProgressHistoryReturn => {
  const [history, setHistory] = useState<ProgressHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (): Promise<void> => {
    if (!materialId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await progressApi.getProgressHistory(materialId);

      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        throw new Error(response.error || '履歴の取得に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '予期しないエラーが発生しました';
      setError(errorMessage);
      console.error('Failed to fetch progress history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (enabled && materialId) {
      fetchHistory();
    }
  }, [materialId, enabled]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};
