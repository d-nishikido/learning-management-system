import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { Course } from '@/types';

interface AdminCourseCardProps {
  course: Course;
  onDelete: (course: Course) => void;
}

export function AdminCourseCard({ course, onDelete }: AdminCourseCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['course', 'common']);

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(course);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header with thumbnail */}
        <div className="flex items-start space-x-4 mb-4">
          {course.thumbnailUrl && (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                {course.title}
              </h3>
              <div className="flex items-center space-x-2 ml-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    difficultyColors[course.difficultyLevel]
                  }`}
                >
                  {t(`course:difficulty.${course.difficultyLevel}`)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  course.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.isPublished ? t('course:published') : t('course:unpublished')}
                </span>
              </div>
            </div>
            
            {course.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* Course details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('course:fields.category')}:</span>
            <span className="text-gray-900 font-medium">{course.category}</span>
          </div>
          
          {course.estimatedHours && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('course:fields.estimatedHours')}:</span>
              <span className="text-gray-900">{course.estimatedHours}{t('common:hour', { count: course.estimatedHours }).charAt(0)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('course:enrolledCount')}:</span>
            <span className="text-gray-900">{course.enrolledCount || 0}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('common:lesson', { count: 2 })}:</span>
            <span className="text-gray-900">{course._count?.lessons || 0}</span>
          </div>
        </div>

        {/* Creator info */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('common:createdBy')}:</span>
            <span className="text-gray-900">
              {course.creator.firstName} {course.creator.lastName}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">{t('common:created')}:</span>
            <span className="text-gray-900">
              {new Date(course.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/courses/${course.id}`)}
            className="flex-1 min-w-0"
          >
            {t('common:view')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}
            className="flex-1 min-w-0"
          >
            {t('common:lesson', { count: 2 })}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
            className="flex-1 min-w-0"
          >
            {t('common:edit')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            className="flex-1 min-w-0"
          >
            {t('common:delete')}
          </Button>
        </div>
      </div>
    </Card>
  );
}