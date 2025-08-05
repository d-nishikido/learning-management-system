import { useState, useEffect } from 'react';
import { MaterialCard } from './MaterialCard';
import { MaterialViewer } from './MaterialViewer';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { materialApi } from '@/services/api';
import type { LearningMaterial, ApiRequestError } from '@/types';

interface MaterialListProps {
  courseId: number;
  lessonId: number;
}

export function MaterialList({ courseId, lessonId }: MaterialListProps) {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setError(null);
        setIsLoading(true);
        
        console.log(`Loading materials for course ${courseId}, lesson ${lessonId}`);
        
        const response = await materialApi.getByLesson(courseId, lessonId, {
          isPublished: true,
        });
        
        console.log('Material API response:', response);
        
        if (response.success && response.data) {
          console.log(`Found ${response.data.materials.length} materials`);
          // Sort materials by category (MAIN first) and then by sortOrder
          const sortedMaterials = response.data.materials.sort((a, b) => {
            if (a.materialCategory !== b.materialCategory) {
              return a.materialCategory === 'MAIN' ? -1 : 1;
            }
            return a.sortOrder - b.sortOrder;
          });
          setMaterials(sortedMaterials);
        } else {
          console.log('No materials found or API returned unsuccessful response');
        }
      } catch (err) {
        const apiError = err as ApiRequestError;
        if (apiError.response?.status === 401) {
          setError('認証が必要です。ログインしてください。');
        } else if (apiError.response?.status === 404) {
          setError('レッスンが見つかりません。');
        } else if (apiError.response?.status === 403) {
          setError('このレッスンにアクセスする権限がありません。');
        } else {
          setError(apiError.response?.data?.message || '教材の読み込みに失敗しました');
        }
        console.error('Material loading error:', apiError);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMaterials();
  }, [courseId, lessonId]);

  const handleMaterialUpdate = (updatedMaterial: LearningMaterial) => {
    setMaterials(prev => 
      prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m)
    );
    setSelectedMaterial(updatedMaterial);
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
            <h3 className="text-sm font-medium text-red-800">エラー</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="mt-4 text-lg text-gray-600">このレッスンにはまだ教材がありません</p>
      </div>
    );
  }

  // Group materials by category
  const mainMaterials = materials.filter(m => m.materialCategory === 'MAIN');
  const supplementaryMaterials = materials.filter(m => m.materialCategory === 'SUPPLEMENTARY');

  return (
    <>
      <div className="space-y-6">
        {mainMaterials.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">メイン教材</h3>
            <div className="space-y-3">
              {mainMaterials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onView={setSelectedMaterial}
                />
              ))}
            </div>
          </div>
        )}

        {supplementaryMaterials.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">補足教材</h3>
            <div className="space-y-3">
              {supplementaryMaterials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onView={setSelectedMaterial}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedMaterial && (
        <MaterialViewer
          material={selectedMaterial}
          courseId={courseId}
          lessonId={lessonId}
          onClose={() => setSelectedMaterial(null)}
          onUpdate={handleMaterialUpdate}
        />
      )}
    </>
  );
}