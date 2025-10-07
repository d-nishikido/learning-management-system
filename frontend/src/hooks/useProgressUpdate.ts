import { useState } from 'react';
import { progressApi } from '@/services/api';
import type { ProgressWithDetails } from '@/types';

interface UseProgressUpdateReturn {
  progress: ProgressWithDetails | null;
  updateProgress: (
    materialId: number,
    progressRate: number,
    spentMinutes?: number,
    notes?: string
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * 進捗率更新のためのカスタムフック
 * 
 * @returns {UseProgressUpdateReturn} 進捗データ、更新関数、ローディング状態、エラー状態
 */
export const useProgressUpdate = (): UseProgressUpdateReturn => {
  const [progress, setProgress] = useState<ProgressWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = async (
    materialId: number,
    progressRate: number,
    spentMinutes?: number,
    notes?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await progressApi.updateManualProgress(materialId, {
        progressRate,
        spentMinutes,
        notes,
      });

      if (response.success && response.data) {
        setProgress(response.data);
      } else {
        throw new Error(response.error || '進捗率の更新に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : '予期しないエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    progress,
    updateProgress,
    isLoading,
    error,
  };
};
