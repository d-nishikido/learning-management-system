import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { materialApi } from '@/services/api';
import { MaterialForm } from './MaterialForm';
import type { LearningMaterial, UpdateLearningMaterialRequest, ApiRequestError } from '@/types';

interface MaterialEditModalProps {
  courseId: number;
  lessonId: number;
  material: LearningMaterial;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialEditModal({
  courseId,
  lessonId,
  material,
  isOpen,
  onClose,
  onSuccess,
}: MaterialEditModalProps) {
  const { t } = useTranslation(['material', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: UpdateLearningMaterialRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await materialApi.update(courseId, lessonId, material.id, data);
      
      if (response.success) {
        onSuccess();
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      setError(apiError.response?.data?.message || t('material:errors.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('material:editMaterial')}
            </h3>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <MaterialForm
            courseId={courseId}
            lessonId={lessonId}
            material={material}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}