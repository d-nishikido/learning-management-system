import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  showActions?: boolean;
  onEnroll?: (courseId: number) => void;
  onUnenroll?: (courseId: number) => void;
  isEnrolled?: boolean;
  isLoading?: boolean;
}

export function CourseCard({ 
  course, 
  showActions = true, 
  onEnroll, 
  onUnenroll, 
  isEnrolled = false,
  isLoading = false
}: CourseCardProps) {
  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };

  const handleEnrollClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEnrolled && onUnenroll) {
      onUnenroll(course.id);
    } else if (!isEnrolled && onEnroll) {
      onEnroll(course.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link to={`/courses/${course.id}`} className="block">
        {course.thumbnailUrl && (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-48 object-cover rounded-t-lg mb-4"
          />
        )}
        
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {course.title}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                difficultyColors[course.difficultyLevel]
              }`}
            >
              {course.difficultyLevel}
            </span>
          </div>

          {course.description && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {course.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {course._count?.lessons || 0} lessons
            </span>
            
            {course.estimatedHours && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.estimatedHours}h
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              by {course.creator.firstName} {course.creator.lastName}
            </span>
            
            <span className="text-xs text-gray-500">
              {course._count?.userProgress || 0} enrolled
            </span>
          </div>

          {showActions && (onEnroll || onUnenroll) && (
            <div className="pt-2">
              <Button
                variant={isEnrolled ? 'outline' : 'primary'}
                size="sm"
                fullWidth
                isLoading={isLoading}
                onClick={handleEnrollClick}
              >
                {isEnrolled ? 'Unenroll' : 'Enroll Now'}
              </Button>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}