import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface ProgressInputFormProps {
  initialProgress: number;
  onSubmit: (progressRate: number, spentMinutes?: number, notes?: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export const ProgressInputForm: React.FC<ProgressInputFormProps> = ({
  initialProgress,
  onSubmit,
  isLoading,
  error: externalError,
}) => {
  const [progressRate, setProgressRate] = useState<number>(initialProgress);
  const [spentMinutes, setSpentMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // 初期進捗率が変更されたら更新
  useEffect(() => {
    setProgressRate(initialProgress);
  }, [initialProgress]);

  /**
   * 進捗率のバリデーション
   */
  const validateProgressRate = (value: number): boolean => {
    if (value < 0 || value > 100) {
      setValidationError('0-100の範囲で入力してください');
      return false;
    }
    if (!Number.isInteger(value)) {
      setValidationError('整数を入力してください');
      return false;
    }
    setValidationError('');
    return true;
  };

  /**
   * 進捗率の変更ハンドラ
   */
  const handleProgressRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setProgressRate(value);
    validateProgressRate(value);
  };

  /**
   * クイック選択ハンドラ
   */
  const handleQuickSelect = (value: number) => {
    setProgressRate(value);
    validateProgressRate(value);
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProgressRate(progressRate)) {
      return;
    }

    try {
      await onSubmit(progressRate, spentMinutes > 0 ? spentMinutes : undefined, notes || undefined);
      // 成功時は親コンポーネントでハンドリング
    } catch (err) {
      // エラーは親コンポーネントでハンドリング
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">進捗率を記録</h3>

          {/* プログレスバープレビュー */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(progressRate, 0), 100)}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-600 mt-1">
              {progressRate}%
            </div>
          </div>

          {/* 進捗率入力フィールド */}
          <div className="mb-4">
            <label htmlFor="progressRate" className="block text-sm font-medium text-gray-700 mb-2">
              進捗率（0-100）
            </label>
            <Input
              id="progressRate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={progressRate}
              onChange={handleProgressRateChange}
              className="w-full"
              inputMode="numeric"
              aria-describedby={validationError ? 'progress-error' : undefined}
              disabled={isLoading}
            />
            {validationError && (
              <p id="progress-error" className="text-red-600 text-sm mt-1">
                {validationError}
              </p>
            )}
          </div>

          {/* クイック選択ボタン */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">クイック選択</p>
            <div className="flex gap-2 flex-wrap">
              {[0, 25, 50, 75, 100].map((value) => (
                <Button
                  key={value}
                  type="button"
                  onClick={() => handleQuickSelect(value)}
                  variant={progressRate === value ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={isLoading}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>

          {/* 学習時間入力 */}
          <div className="mb-4">
            <label htmlFor="spentMinutes" className="block text-sm font-medium text-gray-700 mb-2">
              学習時間（分）（任意）
            </label>
            <Input
              id="spentMinutes"
              type="number"
              min="0"
              step="1"
              value={spentMinutes}
              onChange={(e) => setSpentMinutes(Number(e.target.value))}
              placeholder="例: 30"
              className="w-full"
              inputMode="numeric"
              disabled={isLoading}
            />
          </div>

          {/* メモ入力 */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              メモ（任意）
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="学習内容や気づきを記録..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              maxLength={1000}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {notes.length}/1000
            </p>
          </div>

          {/* エラーメッセージ */}
          {externalError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{externalError}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || !!validationError}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
