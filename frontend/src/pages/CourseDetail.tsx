import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LessonList } from '@/components/lesson';
import { useAuth } from '@/contexts';
import { courseApi, lessonApi } from '@/services/api';
import type { Course, Lesson, ApiRequestError } from '@/types';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courseId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!courseId) return;

    const loadCourseData = async () => {
      try {
        setError(null);
        
        // Load course details
        const courseResponse = await courseApi.getById(courseId);
        if (courseResponse.success && courseResponse.data) {
          setCourse(courseResponse.data);
        }

        // Load lessons
        setIsLessonsLoading(true);
        const lessonsResponse = await lessonApi.getByCourse(courseId, { 
          isPublished: true 
        });
        if (lessonsResponse.success && lessonsResponse.data) {
          setLessons(lessonsResponse.data.lessons);
        }

      } catch (err) {
        setError((err as ApiRequestError).response?.data?.message || 'Failed to load course');
      } finally {
        setIsLoading(false);
        setIsLessonsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!courseId || !user) return;
    
    setActionLoading(true);
    try {
      const response = await courseApi.enroll(courseId);
      if (response.success) {
        setIsEnrolled(true);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || 'Failed to enroll in course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!courseId || !user) return;
    
    setActionLoading(true);
    try {
      const response = await courseApi.unenroll(courseId);
      if (response.success) {
        setIsEnrolled(false);
      }
    } catch (err) {
      setError((err as ApiRequestError).response?.data?.message || 'Failed to unenroll from course');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
          <p className="mt-2 text-gray-600">The course you're looking for doesn't exist.</p>
          <Link to="/courses" className="mt-4 inline-block">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link to="/courses" className="hover:text-gray-700">
              Courses
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li className="text-gray-900">{course.title}</li>
        </ol>
      </nav>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Course Header */}
      <Card className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      difficultyColors[course.difficultyLevel]
                    }`}
                  >
                    {course.difficultyLevel}
                  </span>
                  <span>{course.category}</span>
                  {course.estimatedHours && <span>{course.estimatedHours} hours</span>}
                </div>
              </div>
            </div>

            {course.description && (
              <p className="text-gray-700 mb-4">{course.description}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Created by {course.creator.firstName} {course.creator.lastName}
              </span>
              <span>{course._count?.userProgress || 0} students enrolled</span>
            </div>
          </div>

          <div className="lg:col-span-1">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            {user && (
              <Button
                variant={isEnrolled ? 'outline' : 'primary'}
                fullWidth
                isLoading={actionLoading}
                onClick={isEnrolled ? handleUnenroll : handleEnroll}
              >
                {isEnrolled ? 'Unenroll from Course' : 'Enroll in Course'}
              </Button>
            )}

            {!user && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Sign in to enroll in this course
                </p>
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Course Content */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
          <span className="text-sm text-gray-500">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
          </span>
        </div>

        <LessonList
          lessons={lessons}
          courseId={courseId!}
          isLoading={isLessonsLoading}
        />
      </Card>
    </div>
  );
}