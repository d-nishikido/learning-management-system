import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import type { Course } from '@/types';

interface CourseListViewProps {
  courses: Course[];
  isLoading?: boolean;
  showActions?: boolean;
  onEnroll?: (courseId: number) => Promise<void>;
  onUnenroll?: (courseId: number) => Promise<void>;
  enrolledCourseIds?: number[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function CourseListView({ 
  courses, 
  isLoading = false, 
  showActions = true,
  onEnroll,
  onUnenroll,
  enrolledCourseIds = [],
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: CourseListViewProps) {
  const { t } = useTranslation(['course', 'common']);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleEnroll = async (courseId: number) => {
    if (!onEnroll) return;
    setActionLoading(courseId);
    try {
      await onEnroll(courseId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (courseId: number) => {
    if (!onUnenroll) return;
    setActionLoading(courseId);
    try {
      await onUnenroll(courseId);
    } finally {
      setActionLoading(null);
    }
  };

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no courses available matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('course:fields.title')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common:category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common:difficulty')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common:lesson', { count: 2 })}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('course:fields.estimatedHours')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('course:enrolledCount')}
              </th>
              {showActions && (onEnroll || onUnenroll) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common:actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              const isLoading = actionLoading === course.id;
              
              return (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {course.thumbnailUrl && (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-10 w-10 rounded-lg mr-4 flex-shrink-0 object-cover"
                        />
                      )}
                      <div>
                        <Link
                          to={`/courses/${course.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {course.title}
                        </Link>
                        {course.description && (
                          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        difficultyColors[course.difficultyLevel]
                      }`}
                    >
                      {t(`course:difficulty.${course.difficultyLevel}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course._count?.lessons || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.estimatedHours ? `${course.estimatedHours}${t('common:hour', { count: course.estimatedHours }).charAt(0)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course._count?.userProgress || 0}
                  </td>
                  {showActions && (onEnroll || onUnenroll) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant={isEnrolled ? 'outline' : 'primary'}
                        size="sm"
                        isLoading={isLoading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isEnrolled && onUnenroll) {
                            handleUnenroll(course.id);
                          } else if (!isEnrolled && onEnroll) {
                            handleEnroll(course.id);
                          }
                        }}
                      >
                        {isEnrolled ? t('course:unenrollShort') : t('course:enrollNow')}
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {courses.map((course) => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          const isLoading = actionLoading === course.id;
          
          return (
            <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <Link to={`/courses/${course.id}`} className="block">
                <div className="flex items-start space-x-3">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          difficultyColors[course.difficultyLevel]
                        }`}
                      >
                        {t(`course:difficulty.${course.difficultyLevel}`)}
                      </span>
                      <span className="text-xs text-gray-500">{course.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>{course._count?.lessons || 0} {t('common:lesson', { count: course._count?.lessons || 0 })}</span>
                      {course.estimatedHours && <span>{course.estimatedHours}{t('common:hour', { count: course.estimatedHours }).charAt(0)}</span>}
                      <span>{course._count?.userProgress || 0} {t('common:enrolled', { count: course._count?.userProgress || 0 })}</span>
                    </div>
                  </div>
                </div>
              </Link>
              {showActions && (onEnroll || onUnenroll) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Button
                    variant={isEnrolled ? 'outline' : 'primary'}
                    size="sm"
                    fullWidth
                    isLoading={isLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isEnrolled && onUnenroll) {
                        handleUnenroll(course.id);
                      } else if (!isEnrolled && onEnroll) {
                        handleEnroll(course.id);
                      }
                    }}
                  >
                    {isEnrolled ? t('course:unenrollShort') : t('course:enrollNow')}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            isLoading={isLoadingMore}
          >
            Load More Courses
          </Button>
        </div>
      )}
    </div>
  );
}