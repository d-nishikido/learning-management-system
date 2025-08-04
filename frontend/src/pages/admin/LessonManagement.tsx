import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { lessonApi, courseApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Lesson, Course, LessonQueryParams, ApiRequestError } from '@/types';

export function LessonManagement() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['lesson', 'common']);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');

  useEffect(() => {
    const courseIdNum = parseInt(courseId || '0');
    if (courseIdNum) {
      loadCourse(courseIdNum);
      loadLessons(courseIdNum);
    }
  }, [courseId]);

  useEffect(() => {
    const courseIdNum = parseInt(courseId || '0');
    if (courseIdNum) {
      loadLessons(courseIdNum);
    }
  }, [searchTerm, publishedFilter, courseId]);

  const loadCourse = async (courseIdNum: number) => {
    try {
      const response = await courseApi.getById(courseIdNum);
      if (response.success && response.data) {
        setCourse(response.data);
      }
    } catch (err) {
      console.error('Failed to load course:', err);
    }
  };

  const loadLessons = async (courseIdNum: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: LessonQueryParams = {};
      if (searchTerm) params.search = searchTerm;
      if (publishedFilter !== 'all') {
        params.isPublished = publishedFilter === 'published';
      }

      const response = await lessonApi.getByCourse(courseIdNum, params);
      if (response.success && response.data) {
        setLessons(response.data.lessons);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('lesson:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm(t('lesson:confirmDelete', { title: lesson.title }))) {
      return;
    }

    const courseIdNum = parseInt(courseId || '0');
    if (!courseIdNum) return;

    try {
      setDeleteLoading(lesson.id);
      const response = await lessonApi.delete(courseIdNum, lesson.id);
      if (response.success) {
        await loadLessons(courseIdNum);
      }
    } catch (err) {
      const apiError = err as ApiRequestError;
      alert(apiError.response?.data?.message || t('lesson:errors.deleteFailed'));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreateLesson = () => {
    navigate(`/admin/courses/${courseId}/lessons/new`);
  };

  const handleEditLesson = (lesson: Lesson) => {
    navigate(`/admin/courses/${courseId}/lessons/${lesson.id}/edit`);
  };

  if (!courseId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">{t('lesson:errors.invalidCourse')}</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <Link to="/admin/courses" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  {t('lesson:breadcrumb.courses')}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">
                  {course?.title || t('lesson:breadcrumb.lessons')}
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('lesson:management.title')}
              </h1>
              {course && (
                <p className="mt-1 text-sm text-gray-600">
                  {t('lesson:management.subtitle', { courseTitle: course.title })}
                </p>
              )}
            </div>
            <Button onClick={handleCreateLesson}>
              {t('lesson:createLesson')}
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('lesson:search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <select
                value={publishedFilter}
                onChange={(e) => setPublishedFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">{t('lesson:filters.all')}</option>
                <option value="published">{t('lesson:filters.published')}</option>
                <option value="unpublished">{t('lesson:filters.unpublished')}</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Lessons Table */}
              {lessons.length > 0 ? (
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-0">
                          {t('lesson:table.title')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          {t('lesson:table.description')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {t('lesson:table.estimatedMinutes')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('lesson:table.sortOrder')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('lesson:table.status')}
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                          {t('lesson:table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {lesson.title}
                            </div>
                          </td>
                          <td className="px-3 py-4 hidden sm:table-cell">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {lesson.description || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} ${t('lesson:minutes')}` : '-'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lesson.sortOrder}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lesson.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lesson.isPublished ? t('lesson:status.published') : t('lesson:status.draft')}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium w-40">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditLesson(lesson)}
                                className="text-xs px-2 py-1"
                              >
                                {t('common:edit')}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteLesson(lesson)}
                                disabled={deleteLoading === lesson.id}
                                className="text-xs px-2 py-1"
                              >
                                {deleteLoading === lesson.id ? (
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
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.093 5 7 5s-3.832.477-5 1.253v13C3.832 18.477 5.57 18 8 18s4.168.477 5 1.253m0-13C13.168 5.477 14.93 5 17 5s3.832.477 5 1.253v13C20.168 18.477 18.43 18 16 18s-4.168.477-5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t('lesson:noLessons.title')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('lesson:noLessons.description')}
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleCreateLesson}>
                      {t('lesson:createLesson')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}