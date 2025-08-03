import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { materialApi } from '@/services/api';
import type { LearningMaterial, ApiRequestError } from '@/types';

interface ManualProgressFormProps {
  material: LearningMaterial;
  onSave: (material: LearningMaterial) => void;
  onCancel: () => void;
}

export function ManualProgressForm({ material, onSave, onCancel }: ManualProgressFormProps) {
  const [progressRate, setProgressRate] = useState(
    material.userProgress?.manualProgressRate || material.userProgress?.progressRate || 0
  );
  const [spentMinutes, setSpentMinutes] = useState(material.userProgress?.spentMinutes || 0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await materialApi.updateManualProgress(material.id, {
        progressRate,
        spentMinutes,
        notes: notes.trim() || undefined,
      });
      
      if (response.success && response.data) {
        // Update the material with new progress data
        const updatedMaterial: LearningMaterial = {
          ...material,
          userProgress: {
            progressRate: response.data.progressRate,
            manualProgressRate: response.data.manualProgressRate,
            spentMinutes: response.data.spentMinutes,
            isCompleted: response.data.isCompleted,
            lastAccessed: response.data.lastAccessed,
          },
        };
        
        onSave(updatedMaterial);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || '進捗の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">学習進捗の記録</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Progress Rate Slider */}
        <div>
          <label htmlFor="progress-rate" className="block text-sm font-medium text-gray-700">
            進捗率: <span className="font-bold text-lg">{progressRate}%</span>
          </label>
          <div className="mt-2">
            <input
              type="range"
              id="progress-rate"
              min="0"
              max="100"
              step="5"
              value={progressRate}
              onChange={(e) => setProgressRate(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
        
        {/* Study Time Input */}
        <div>
          <label htmlFor="spent-minutes" className="block text-sm font-medium text-gray-700">
            学習時間（分）
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="spent-minutes"
              min="0"
              value={spentMinutes}
              onChange={(e) => setSpentMinutes(Number(e.target.value))}
              className="block w-full pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">分</span>
            </div>
          </div>
        </div>
        
        {/* Notes Input */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            メモ（任意）
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="学習内容のメモや感想を記入できます"
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </div>
      
      {progressRate === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-700">
              素晴らしい！この教材の学習を完了しました。
            </p>
          </div>
        </div>
      )}
    </form>
  );
}