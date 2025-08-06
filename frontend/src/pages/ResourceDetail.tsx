import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, Eye, Star, Tag, Clock, Edit, Trash2 } from 'lucide-react';
import { resourceApi } from '@/services/api';
import { useAuth } from '@/contexts';
import type { LearningResource } from '@/types';
import { getImportanceColor, getResourceTypeIcon, getResourceTypeLabel, getDifficultyColor, getImportanceLabel } from '@/utils/resourceHelpers';

export const ResourceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('resources');
  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadResource(parseInt(id));
    }
  }, [id]);

  const loadResource = async (resourceId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await resourceApi.getById(resourceId);
      
      if (response.success && response.data) {
        setResource(response.data);
      } else {
        throw new Error(response.error || 'Failed to load resource');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResource = () => {
    if (resource?.resourceUrl) {
      window.open(resource.resourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEdit = () => {
    if (resource) {
      // Navigate to edit page - to be implemented when admin forms are available
      alert(t('detail.editNotImplemented', 'Edit functionality will be implemented in the next phase'));
    }
  };

  const handleDelete = async () => {
    if (!resource) return;
    
    const confirmDelete = window.confirm(
      t('detail.deleteConfirmation', 'Are you sure you want to delete this resource? This action cannot be undone.')
    );
    
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      const response = await resourceApi.delete(resource.id);
      
      if (response.success) {
        alert(t('detail.deleteSuccess', 'Resource deleted successfully'));
        navigate('/resources');
      } else {
        throw new Error(response.error || 'Failed to delete resource');
      }
    } catch (err) {
      alert(t('detail.deleteError', 'Failed to delete resource. Please try again.'));
      console.error('Delete resource error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('detail.notFound', 'Resource Not Found')}
          </h2>
          <p className="text-gray-600 mb-4">{error || t('detail.notFoundDescription', 'The resource you are looking for does not exist.')}</p>
          <button
            onClick={() => navigate('/resources')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('detail.backToLibrary', 'Back to Resource Library')}
          </button>
        </div>
      </div>
    );
  }

  const importanceColorClass = getImportanceColor(resource.importance);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/resources')}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('detail.backToLibrary', 'Back to Resource Library')}
              </button>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                  aria-label={t('detail.editResource', 'Edit this resource')}
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('detail.edit', 'Edit')}
                </button>
                <button 
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                  aria-label={t('detail.deleteResource', 'Delete this resource')}
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isDeleting ? t('detail.deleting', 'Deleting...') : t('detail.delete', 'Delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            {/* Resource Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div 
                  className="text-4xl" 
                  role="img" 
                  aria-label={`${getResourceTypeLabel(resource.resourceType)} resource`}
                >
                  {getResourceTypeIcon(resource.resourceType)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                  {resource.description && (
                    <p className="text-lg text-gray-600">{resource.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleOpenResource}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label={t('detail.openResourceExternal', 'Open resource in new tab')}
              >
                <ExternalLink className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('detail.openResource', 'Open Resource')}
              </button>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('detail.importance', 'Importance')}</h3>
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${importanceColorClass}`}
                    aria-label={`Importance level: ${getImportanceLabel(resource.importance)}`}
                  >
                    {resource.importance === 'REQUIRED' && <Star className="h-4 w-4 mr-1" aria-hidden="true" />}
                    {resource.importance}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('detail.difficulty', 'Difficulty')}</h3>
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(resource.difficultyLevel)}`}
                    aria-label={`Difficulty level: ${resource.difficultyLevel}`}
                  >
                    {resource.difficultyLevel}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('detail.type', 'Type')}</h3>
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    aria-label={`Resource type: ${getResourceTypeLabel(resource.resourceType)}`}
                  >
                    {resource.resourceType}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {resource.parsedTags && resource.parsedTags.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">{t('detail.tags', 'Tags')}</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.parsedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{t('detail.statistics', 'Statistics')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {resource.viewCount} {t('detail.views', 'views')}
                  </span>
                </div>
                {resource._count && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {resource._count.userMaterialAccess} {t('detail.accesses', 'accesses')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Context Information */}
            {(resource.course || resource.lesson) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">{t('detail.context', 'Context')}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {resource.lesson ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('detail.fromLesson', 'From Lesson:')}</p>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/courses/${resource.lesson.course.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {resource.lesson.course.title}
                        </Link>
                        <span className="text-gray-400">→</span>
                        <Link
                          to={`/courses/${resource.lesson.course.id}/lessons/${resource.lesson.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {resource.lesson.title}
                        </Link>
                      </div>
                    </div>
                  ) : resource.course ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('detail.fromCourse', 'From Course:')}</p>
                      <Link
                        to={`/courses/${resource.course.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {resource.course.title}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};