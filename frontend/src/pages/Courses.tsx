import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CourseList, CourseFilters } from '@/components/course';
import { useAuth } from '@/contexts';
import { courseApi } from '@/services/api';
import type { Course, CourseQueryParams, ApiRequestError } from '@/types';

type ViewMode = 'card' | 'list';

export function Courses() {
  const { user } = useAuth();
  const { t } = useTranslation(['course', 'common']);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('courseViewMode');
    return (saved as ViewMode) || 'card';
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<CourseQueryParams>({
    isPublished: true,
    page: 1,
    limit: 12,
  });

  // Extract unique categories from courses
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(courses.map(course => course.category)));
    return uniqueCategories.sort();
  }, [courses]);

  // Load courses
  const loadCourses = async (params: CourseQueryParams, append = false) => {
    try {
      setError(null);
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await courseApi.getAll(params);
      
      if (response.success && response.data) {
        if (append) {
          setCourses(prev => [...prev, ...response.data!.courses]);
        } else {
          setCourses(response.data.courses);
        }
        
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.loadFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load initial courses
  useEffect(() => {
    loadCourses(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFiltersChange = (newFilters: CourseQueryParams) => {
    const updatedFilters = { ...newFilters, page: 1, limit: 12 };
    setFilters(updatedFilters);
    setCurrentPage(1);
    loadCourses(updatedFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultFilters: CourseQueryParams = {
      isPublished: true,
      page: 1,
      limit: 12,
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
    loadCourses(defaultFilters);
  };

  // Load more courses
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      loadCourses({ ...filters, page: nextPage }, true);
    }
  };

  // Handle course enrollment
  const handleEnroll = async (courseId: number) => {
    if (!user) return;
    try {
      const response = await courseApi.enroll(courseId);
      if (response.success) {
        setEnrolledCourseIds(prev => [...prev, courseId]);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.enrollFailed'));
    } finally {
      // Action completed
    }
  };

  // Handle course unenrollment
  const handleUnenroll = async (courseId: number) => {
    if (!user) return;
    try {
      const response = await courseApi.unenroll(courseId);
      if (response.success) {
        setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || t('course:errors.unenrollFailed'));
    } finally {
      // Action completed
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('courseViewMode', mode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('course:title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('course:description')}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <CourseFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            categories={categories}
          />
        </div>

        {/* Course List */}
        <div className="lg:col-span-3">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              {total > 0 && (
                <span>
                  {t('common:showing', { count: courses.length, total, item: t('common:course', { count: total }) })}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 mr-2">{t('course:viewMode.view')}:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
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
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md flex items-center justify-center transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title={t('course:viewMode.switchToList')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <CourseList
            courses={courses}
            isLoading={isLoading}
            showActions={!!user}
            onEnroll={handleEnroll}
            onUnenroll={handleUnenroll}
            enrolledCourseIds={enrolledCourseIds}
            onLoadMore={handleLoadMore}
            hasMore={currentPage < totalPages}
            isLoadingMore={isLoadingMore}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
}