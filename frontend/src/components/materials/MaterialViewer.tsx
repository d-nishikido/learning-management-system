import { useState, useEffect } from 'react';
import { ManualProgressForm } from './ManualProgressForm';
import { Button } from '@/components/common/Button';
import { materialApi } from '@/services/api';
import type { LearningMaterial, ApiRequestError } from '@/types';

interface MaterialViewerProps {
  material: LearningMaterial;
  courseId: number;
  lessonId: number;
  onClose: () => void;
  onUpdate: (material: LearningMaterial) => void;
}

export function MaterialViewer({ material, courseId, lessonId, onClose, onUpdate }: MaterialViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    // Reset states when material changes
    setError(null);
    setShowProgressForm(false);
    
    // Clean up previous blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    
    // Create authenticated blob URL for file materials
    if (material.materialType === 'FILE' && material.filePath) {
      createAuthenticatedUrl();
    }
  }, [material.id]);

  const createAuthenticatedUrl = async () => {
    try {
      setLoadingMedia(true);
      const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const authToken = localStorage.getItem('authToken');
      
      console.log(`Creating authenticated URL for material ${material.id}`);
      console.log(`API URL: ${baseApiUrl}/api/v1/courses/${courseId}/lessons/${lessonId}/materials/${material.id}/download`);
      console.log(`Auth token exists: ${!!authToken}`);
      
      const response = await fetch(
        `${baseApiUrl}/api/v1/courses/${courseId}/lessons/${lessonId}/materials/${material.id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      console.log(`Download response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download response error:', errorText);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`Blob created, size: ${blob.size} bytes, type: ${blob.type}`);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (error) {
      console.error('Error creating authenticated URL:', error);
      setError('ファイルの読み込みに失敗しました');
    } finally {
      setLoadingMedia(false);
    }
  };

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const blob = await materialApi.download(courseId, lessonId, material.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.title + (material.fileType ? `.${material.fileType.split('/')[1]}` : '');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || 'ダウンロードに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const renderFileContent = () => {
    if (!material.filePath) return null;

    if (loadingMedia) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!blobUrl) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">ファイルの読み込みに失敗しました</p>
        </div>
      );
    }

    if (material.fileType?.startsWith('video/')) {
      return (
        <video 
          controls 
          className="w-full max-h-[500px]"
          controlsList="nodownload"
        >
          <source src={blobUrl} type={material.fileType} />
          お使いのブラウザは動画再生に対応していません。
        </video>
      );
    }

    if (material.fileType?.startsWith('audio/')) {
      return (
        <audio 
          controls 
          className="w-full"
          controlsList="nodownload"
        >
          <source src={blobUrl} type={material.fileType} />
          お使いのブラウザは音声再生に対応していません。
        </audio>
      );
    }

    if (material.fileType === 'application/pdf') {
      return (
        <iframe
          src={blobUrl}
          className="w-full h-[600px] border-0"
          title={material.title}
        />
      );
    }

    if (material.fileType?.startsWith('image/')) {
      return (
        <img 
          src={blobUrl} 
          alt={material.title}
          className="max-w-full h-auto mx-auto"
        />
      );
    }

    // Other file types - show download button
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <p className="text-lg text-gray-600 mb-4">このファイルはブラウザで直接表示できません</p>
        <Button onClick={handleDownload} disabled={isLoading}>
          {isLoading ? 'ダウンロード中...' : 'ファイルをダウンロード'}
        </Button>
      </div>
    );
  };

  const renderUrlContent = () => {
    if (!material.externalUrl) return null;

    const youtubeEmbedUrl = getYouTubeEmbedUrl(material.externalUrl);
    
    if (youtubeEmbedUrl) {
      return (
        <iframe
          src={youtubeEmbedUrl}
          className="w-full h-[500px] border-0"
          title={material.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Try to embed other URLs in iframe with sandbox
    return (
      <div>
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                外部コンテンツが埋め込まれています。セキュリティのため、一部の機能が制限される場合があります。
              </p>
            </div>
          </div>
        </div>
        
        <iframe
          src={material.externalUrl}
          className="w-full h-[600px] border-0"
          title={material.title}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
        
        <div className="mt-4 text-center">
          <a 
            href={material.externalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            新しいタブで開く
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  const renderManualProgressContent = () => {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">外部学習教材</h3>
        <p className="text-gray-600 mb-6">
          この教材は外部での学習を想定しています。<br />
          学習が完了したら、下のボタンから進捗を記録してください。
        </p>
        {material.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <h4 className="font-medium text-gray-900 mb-2">学習内容</h4>
            <p className="text-gray-700">{material.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{material.title}</h2>
                {material.description && (
                  <p className="mt-2 text-gray-600">{material.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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

            {/* Content */}
            <div className="mt-4">
              {material.materialType === 'FILE' && renderFileContent()}
              {material.materialType === 'URL' && renderUrlContent()}
              {material.materialType === 'MANUAL_PROGRESS' && renderManualProgressContent()}
            </div>

            {/* Progress Form */}
            {(material.allowManualProgress || material.materialType === 'MANUAL_PROGRESS') && (
              <div className="mt-6">
                {!showProgressForm ? (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowProgressForm(true)}
                    >
                      進捗を記録する
                    </Button>
                  </div>
                ) : (
                  <ManualProgressForm
                    material={material}
                    onSave={(updatedMaterial) => {
                      onUpdate(updatedMaterial);
                      setShowProgressForm(false);
                    }}
                    onCancel={() => setShowProgressForm(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {material.materialType === 'FILE' && material.filePath && (
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isLoading}
                className="ml-3"
              >
                {isLoading ? 'ダウンロード中...' : 'ダウンロード'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
            >
              閉じる
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}