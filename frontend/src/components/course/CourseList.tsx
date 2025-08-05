import { useState } from 'react';
import { CourseCard } from './CourseCard';
import { CourseListView } from './CourseListView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import type { Course } from '@/types';

type ViewMode = 'card' | 'list';

interface CourseListProps {
  courses: Course[];
  isLoading?: boolean;
  showActions?: boolean;
  onEnroll?: (courseId: number) => Promise<void>;
  onUnenroll?: (courseId: number) => Promise<void>;
  enrolledCourseIds?: number[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  viewMode?: ViewMode;
}

export function CourseList({ 
  courses, 
  isLoading = false, 
  showActions = true,
  onEnroll,
  onUnenroll,
  enrolledCourseIds = [],
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  viewMode = 'card'
}: CourseListProps) {
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

  // Render based on view mode
  if (viewMode === 'list') {
    return (
      <CourseListView
        courses={courses}
        isLoading={isLoading}
        showActions={showActions}
        onEnroll={handleEnroll}
        onUnenroll={handleUnenroll}
        enrolledCourseIds={enrolledCourseIds}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />
    );
  }

  // Default card view
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            showActions={showActions}
            onEnroll={handleEnroll}
            onUnenroll={handleUnenroll}
            isEnrolled={enrolledCourseIds.includes(course.id)}
            isLoading={actionLoading === course.id}
          />
        ))}
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