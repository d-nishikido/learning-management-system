import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseApi } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AdminCourseCard } from '@/components/course';
import type { Course, CourseQueryParams, ApiRequestError } from '@/types';

type ViewMode = 'card' | 'table';

export function CourseManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['course', 'common']);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('adminCourseViewMode');
    return (saved as ViewMode) || 'table';
  });

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    loadCourses();
  }, [currentPage, searchTerm, filterCategory, filterPublished]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: CourseQueryParams = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        category: filterCategory || undefined,
      };

      // Convert filter to boolean or undefined
      if (filterPublished === 'published') {
        params.isPublished = true;
      } else if (filterPublished === 'unpublished') {
        params.isPublished = false;
      }
      // 'all' means no filter, so isPublished remains undefined

      const response = await courseApi.getAll(params);
      
      if (response.success && response.data) {
        setCourses(response.data.courses);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(t('course:confirmDelete', { title: course.title }))) {
      return;
    }

    try {
      setError(null);
      const response = await courseApi.delete(course.id);
      
      if (response.success) {
        setSuccessMessage(t('course:messages.deleteSuccess'));
        loadCourses(); // Reload the list
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.deleteFailed'));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterPublished('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('adminCourseViewMode', mode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('course:adminTitle')}</h1>
            <p className="mt-2 text-gray-600">{t('course:adminDescription')}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('table')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={t('course:viewMode.switchToList')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('card')}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={t('course:viewMode.switchToCard')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
                </svg>
              </button>
            </div>
            
            <Button onClick={() => navigate('/admin/courses/new')}>
              {t('course:createCourse')}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Input
                type="text"
                id="search"
                label={t('common:search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('course:searchPlaceholder')}
              />
            </div>

            {/* Category Filter */}
            <div>
              <Input
                type="text"
                id="category"
                label={t('course:fields.category')}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                placeholder={t('course:filterByCategory')}
              />
            </div>

            {/* Published Filter */}
            <div>
              <label htmlFor="published" className="block text-sm font-medium text-gray-700">
                {t('course:status')}
              </label>
              <select
                id="published"
                value={filterPublished}
                onChange={(e) => setFilterPublished(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">{t('common:all')}</option>
                <option value="published">{t('course:published')}</option>
                <option value="unpublished">{t('course:unpublished')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t('common:clearFilters')}
            </Button>
            <Button type="submit">
              {t('common:search')}
            </Button>
          </div>
        </form>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">{t('course:noCourses')}</p>
        </div>
      ) : (
        <>
          {/* Course Display - Card or Table View */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <AdminCourseCard
                  key={course.id}
                  course={course}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-x-auto">
              <div className="min-w-full">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('course:fields.title')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('course:fields.category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('course:fields.difficultyLevel')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('course:status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('course:enrolledCount')}
                    </th>
                    <th className="relative px-6 py-3 w-48">
                      <span className="sr-only">{t('common:actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          {course.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {course.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t(`course:difficulty.${course.difficultyLevel.toLowerCase()}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.isPublished ? t('course:published') : t('course:unpublished')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.enrolledCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-48">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="px-2"
                          >
                            {t('common:view')}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}
                            className="px-2"
                          >
                            {t('common:lesson', { count: 2 })}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                            className="px-2"
                          >
                            {t('common:edit')}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(course)}
                            className="px-2"
                          >
                            {t('common:delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('common:showing', { 
                  from: (currentPage - 1) * 10 + 1,
                  to: Math.min(currentPage * 10, total),
                  total,
                  item: t('common:course', { count: total })
                })}
              </div>
              <nav className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('common:previous')}
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {/* Show ellipsis if there's a gap */}
                      {index > 0 && array[index - 1] < page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('common:next')}
                </Button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}