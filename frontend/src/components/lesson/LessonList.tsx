import { LessonCard } from './LessonCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Lesson, ProgressWithDetails } from '@/types';

interface LessonListProps {
  lessons: Lesson[];
  courseId: number;
  isLoading?: boolean;
  completedLessonIds?: number[];
  lessonProgress?: Map<number, ProgressWithDetails> | Record<number, number>;
  onToggleComplete?: (lessonId: number, completed: boolean) => Promise<void>;
  togglingLessonId?: number | null;
}

export function LessonList({
  lessons,
  courseId,
  isLoading = false,
  completedLessonIds = [],
  lessonProgress = {},
  onToggleComplete,
  togglingLessonId
}: LessonListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This course doesn't have any lessons yet.
        </p>
      </div>
    );
  }

  // Sort lessons by sortOrder
  const sortedLessons = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder);

  // Helper to get progress data
  const getProgress = (lessonId: number) => {
    if (lessonProgress instanceof Map) {
      return lessonProgress.get(lessonId);
    }
    return lessonProgress[lessonId];
  };

  return (
    <div className="space-y-4">
      {sortedLessons.map((lesson, index) => {
        const progress = getProgress(lesson.id);
        const isCompleted = progress
          ? typeof progress === 'object'
            ? progress.isCompleted
            : progress >= 100
          : completedLessonIds.includes(lesson.id);
        const progressRate = progress
          ? typeof progress === 'object'
            ? Number(progress.progressRate)
            : progress
          : 0;

        return (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            courseId={courseId}
            index={index}
            isCompleted={isCompleted}
            progress={progressRate}
            onToggleComplete={onToggleComplete}
            isTogglingComplete={togglingLessonId === lesson.id}
          />
        );
      })}
    </div>
  );
}