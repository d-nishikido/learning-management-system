import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import type { Lesson } from '@/types';

interface LessonCardProps {
  lesson: Lesson;
  courseId: number;
  index?: number;
  isCompleted?: boolean;
  progress?: number;
}

export function LessonCard({ 
  lesson, 
  courseId, 
  index, 
  isCompleted = false, 
  progress = 0 
}: LessonCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="block">
        <div className="flex items-start space-x-4">
          {/* Lesson Number Circle */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
            isCompleted 
              ? 'bg-green-100 text-green-800' 
              : progress > 0
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isCompleted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index !== undefined ? index + 1 : lesson.sortOrder
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                {lesson.title}
              </h3>
              
              {!lesson.isPublished && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Draft
                </span>
              )}
            </div>

            {lesson.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {lesson.description}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              {lesson.estimatedMinutes && (
                <span className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {lesson.estimatedMinutes} min
                </span>
              )}

              {progress > 0 && progress < 100 && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}