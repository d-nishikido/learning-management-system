import { useTranslation } from 'react-i18next';
import { ExternalLink, Download, Clock, FileText, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { LearningMaterial, LearningResource } from '@/types';

interface SearchResult {
  type: 'material' | 'resource';
  data: LearningMaterial | LearningResource;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  onLoadMore?: () => void;
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function SearchResults({
  results,
  isLoading,
  error,
  total,
  page,
  totalPages,
  onLoadMore,
  onRetry,
  hasMore = false,
  isLoadingMore = false
}: SearchResultsProps) {
  const { t } = useTranslation(['search', 'common']);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}${t('common:minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}${t('common:hours')}`;
    }
    return `${hours}${t('common:hours')} ${remainingMinutes}${t('common:minutes')}`;
  };

  const handleDownload = (material: LearningMaterial) => {
    if (material.materialType === 'FILE' && material.lesson) {
      const downloadUrl = `/api/v1/courses/${material.lesson.courseId}/lessons/${material.lessonId}/materials/${material.id}/download`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('search:loading')}</p>
        </div>
      </div>
    );
  }

  if (error && results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">{t('search:error')}</p>
        </div>
        <Button onClick={onRetry}>
          {t('search:tryAgain')}
        </Button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search:noResults')}</h3>
        <p className="text-gray-600">{t('search:noResultsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          {total === 1 
            ? t('search:resultsSingle', { count: total })
            : t('search:resultsCount', { count: total })
          }
        </h2>
      </div>

      {/* Results list */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const isResource = result.type === 'resource';
          const item = result.data;

          return (
            <div
              key={`${result.type}-${item.id}-${index}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isResource 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isResource ? t('search:resources') : t('search:materials')}
                    </span>
                    
                    {!isResource && (item as LearningMaterial).materialCategory && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t(`search:${(item as LearningMaterial).materialCategory!.toLowerCase()}`)}
                      </span>
                    )}

                    {isResource && (item as LearningResource).importance && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (item as LearningResource).importance === 'REQUIRED' 
                          ? 'bg-red-100 text-red-800'
                          : (item as LearningResource).importance === 'RECOMMENDED'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`search:${(item as LearningResource).importance!.toLowerCase()}`)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Course/Lesson info */}
                  <div className="text-sm text-gray-500 mb-3">
                    {isResource ? (
                      (item as LearningResource).course ? (
                        <span>
                          {t('search:course')}: {(item as LearningResource).course!.title}
                          {(item as LearningResource).lesson && (
                            <> → {t('search:lesson')}: {(item as LearningResource).lesson!.title}</>
                          )}
                        </span>
                      ) : (
                        (item as LearningResource).lesson && (
                          <span>
                            {t('search:lesson')}: {(item as LearningResource).lesson!.title}
                          </span>
                        )
                      )
                    ) : (
                      (item as LearningMaterial).lesson && (
                        <span>
                          {t('search:course')}: {(item as LearningMaterial).lesson.course.title}
                          {' → '}
                          {t('search:lesson')}: {(item as LearningMaterial).lesson.title}
                        </span>
                      )
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {!isResource && (item as LearningMaterial).durationMinutes && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{t('search:duration')}: {formatDuration((item as LearningMaterial).durationMinutes!)}</span>
                      </div>
                    )}

                    {!isResource && (item as LearningMaterial).fileSize && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{t('search:fileSize')}: {formatFileSize((item as LearningMaterial).fileSize!)}</span>
                      </div>
                    )}

                    {isResource && (item as LearningResource).viewCount > 0 && (
                      <span>{t('search:viewCount', { count: (item as LearningResource).viewCount })}</span>
                    )}

                    {!isResource && (item as LearningMaterial)._count?.userProgress && (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{t('search:progressCount', { count: (item as LearningMaterial)._count.userProgress })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  {isResource ? (
                    <Button
                      size="sm"
                      onClick={() => handleOpenUrl((item as LearningResource).resourceUrl)}
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{t('search:viewResource')}</span>
                    </Button>
                  ) : (
                    <>
                      {(item as LearningMaterial).materialType === 'FILE' ? (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(item as LearningMaterial)}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>{t('search:download')}</span>
                        </Button>
                      ) : (item as LearningMaterial).materialType === 'URL' && (item as LearningMaterial).externalUrl ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenUrl((item as LearningMaterial).externalUrl!)}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{t('search:openUrl')}</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/courses/${(item as LearningMaterial).lesson?.courseId}/lessons/${(item as LearningMaterial).lessonId}`}
                        >
                          {t('search:viewMaterial')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="px-8"
          >
            {isLoadingMore ? t('common:loading') : t('common:loadMore')}
          </Button>
        </div>
      )}

      {/* Pagination info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-gray-600">
          {t('common:page')} {page} {t('common:of')} {totalPages}
        </div>
      )}
    </div>
  );
}