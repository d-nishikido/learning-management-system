import React from 'react';
import { Card } from '../common/Card';
import type { ProgressHistoryEntry } from '@/types';

interface ProgressHistoryListProps {
  history: ProgressHistoryEntry[];
  isLoading: boolean;
}

export const ProgressHistoryList: React.FC<ProgressHistoryListProps> = ({ history, isLoading }) => {
  /**
   * 日時のフォーマット
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center py-8">まだ進捗の記録がありません</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">進捗履歴</h3>
      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {entry.progressRate}%
                  </span>
                  {entry.delta !== undefined && entry.delta !== 0 && (
                    <span
                      className={`text-sm font-medium ${
                        entry.delta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {entry.delta >= 0 ? '+' : ''}
                      {entry.delta}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(entry.createdAt)}
                </p>
                {entry.spentMinutes > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    学習時間: {entry.spentMinutes}分
                  </p>
                )}
                {entry.notes && (
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
