import React, { useState } from 'react';
import { ProgressInputForm } from './ProgressInputForm';
import { ProgressHistoryList } from './ProgressHistoryList';
import { useProgressUpdate } from '@/hooks/useProgressUpdate';
import { useProgressHistory } from '@/hooks/useProgressHistory';
import { useToast } from '@/hooks/useToast';

interface MaterialProgressContainerProps {
  materialId: number;
  currentProgress?: number;
  onProgressUpdate?: (newProgress: number) => void;
}

/**
 * 教材進捗管理のコンテナコンポーネント
 * 進捗率入力フォームと履歴表示を統合
 * 
 * @param {number} materialId - 教材ID
 * @param {number} currentProgress - 現在の進捗率（0-100）
 * @param {(newProgress: number) => void} onProgressUpdate - 進捗更新時のコールバック
 */
export const MaterialProgressContainer: React.FC<MaterialProgressContainerProps> = ({
  materialId,
  currentProgress = 0,
  onProgressUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');
  
  const { updateProgress, isLoading, error } = useProgressUpdate();
  const { history, isLoading: historyLoading, refetch: refetchHistory } = useProgressHistory(
    materialId,
    activeTab === 'history'
  );
  const { showSuccess, showError } = useToast();

  /**
   * 進捗率更新ハンドラ
   */
  const handleSubmit = async (
    progressRate: number,
    spentMinutes?: number,
    notes?: string
  ): Promise<void> => {
    try {
      await updateProgress(materialId, progressRate, spentMinutes, notes);

      // 成功メッセージ
      if (progressRate === 100) {
        showSuccess('🎉 おめでとうございます！教材を完了しました', 5000);
      } else {
        showSuccess('進捗率を更新しました', 3000);
      }

      // 履歴を再取得
      await refetchHistory();

      // 親コンポーネントに通知
      if (onProgressUpdate) {
        onProgressUpdate(progressRate);
      }

      // グローバルイベントを発火してダッシュボードを更新
      window.dispatchEvent(new CustomEvent('progressUpdated'));
    } catch (err) {
      // エラーメッセージ
      const errorMessage = err instanceof Error ? err.message : '進捗率の更新に失敗しました';
      showError(errorMessage, {
        label: '再試行',
        onClick: () => handleSubmit(progressRate, spentMinutes, notes),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('input')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'input'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            進捗率入力
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            進捗履歴
          </button>
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'input' ? (
          <ProgressInputForm
            initialProgress={currentProgress}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error || undefined}
          />
        ) : (
          <ProgressHistoryList history={history} isLoading={historyLoading} />
        )}
      </div>
    </div>
  );
};
