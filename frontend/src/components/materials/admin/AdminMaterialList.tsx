import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { materialApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MaterialEditModal } from './MaterialEditModal';
import type { LearningMaterial, ApiRequestError } from '@/types';

interface AdminMaterialListProps {
  courseId: number;
  lessonId: number;
  onAddNew: () => void;
}

export function AdminMaterialList({ courseId, lessonId, onAddNew }: AdminMaterialListProps) {
  const { t } = useTranslation(['material', 'common']);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [courseId, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMaterials = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await materialApi.getByLesson(courseId, lessonId, {
        // Include unpublished materials for admin
        isPublished: undefined,
      });
      
      if (response.success && response.data) {
        setMaterials(response.data.materials);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('material:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (material: LearningMaterial) => {
    if (!confirm(t('material:confirmDelete', { title: material.title }))) {
      return;
    }

    try {
      setDeleteLoading(material.id);
      const response = await materialApi.delete(courseId, lessonId, material.id);
      if (response.success) {
        await loadMaterials();
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      alert(apiError.response?.data?.message || t('material:errors.deleteFailed'));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditComplete = () => {
    setEditingMaterial(null);
    loadMaterials();
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMaterialTypeIcon = (type: string) => {
    switch (type) {
      case 'FILE':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'URL':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'MANUAL_PROGRESS':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('common:error')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{t('material:management.title')}</h3>
          <Button onClick={onAddNew} size="sm">
            {t('material:actions.addNew')}
          </Button>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="mt-4 text-sm text-gray-600">{t('material:noMaterials')}</p>
            <Button onClick={onAddNew} size="sm" className="mt-4">
              {t('material:actions.addFirst')}
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.type')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.title')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.category')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.details')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.status')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('material:table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-500">
                        {getMaterialTypeIcon(material.materialType)}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{material.title}</div>
                        {material.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {material.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.materialCategory === 'MAIN' 
                        ? t('material:categories.main') 
                        : t('material:categories.supplementary')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.materialType === 'FILE' && (
                        <div>
                          <div>{formatFileSize(material.fileSize || 0)}</div>
                          {material.fileType && (
                            <div className="text-xs">{material.fileType}</div>
                          )}
                        </div>
                      )}
                      {material.materialType === 'URL' && (
                        <a 
                          href={material.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-500 truncate block max-w-xs"
                        >
                          {material.externalUrl}
                        </a>
                      )}
                      {material.materialType === 'MANUAL_PROGRESS' && (
                        <span>{t('material:types.manualProgress')}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        material.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {material.isPublished ? t('material:status.published') : t('material:status.draft')}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingMaterial(material)}
                          className="text-xs px-2 py-1"
                        >
                          {t('common:edit')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(material)}
                          disabled={deleteLoading === material.id}
                          className="text-xs px-2 py-1"
                        >
                          {deleteLoading === material.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            t('common:delete')
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingMaterial && (
        <MaterialEditModal
          courseId={courseId}
          lessonId={lessonId}
          material={editingMaterial}
          isOpen={true}
          onClose={() => setEditingMaterial(null)}
          onSuccess={handleEditComplete}
        />
      )}
    </>
  );
}