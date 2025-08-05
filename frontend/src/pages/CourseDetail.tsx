import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LessonList } from '@/components/lesson';
import { useAuth } from '@/contexts';
import { courseApi, lessonApi, userApi } from '@/services/api';
import type { Course, Lesson, ApiRequestError } from '@/types';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation(['course', 'common']);
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

        // Check enrollment status if user is logged in
        if (user) {
          try {
            const enrollmentResponse = await userApi.getEnrolledCourses();
            if (enrollmentResponse.success && enrollmentResponse.data) {
              setIsEnrolled(enrollmentResponse.data.courseIds.includes(courseId));
            }
          } catch (err) {
            console.error('Failed to check enrollment status:', err);
            // Don't show error as this is not critical
          }
        }

      } catch (err) {
        setError((err as ApiRequestError).response?.data?.message || t('course:errors.loadFailed'));
      } finally {
        setIsLoading(false);
        setIsLessonsLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!courseId || !user || !course) return;
    
    setActionLoading(true);
    try {
      const response = await courseApi.enroll(courseId);
      if (response.success) {
        setIsEnrolled(true);
        // Update the enrollment count
        setCourse(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            userProgress: (prev._count?.userProgress || 0) + 1
          }
        } : prev);
      }
    } catch (err) {
      console.error('Enrollment failed:', err);
      const errorMessage = (err as ApiRequestError).response?.data?.message || t('course:errors.enrollFailed');
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!courseId || !user || !course) return;
    
    setActionLoading(true);
    try {
      const response = await courseApi.unenroll(courseId);
      if (response.success) {
        setIsEnrolled(false);
        // Update the enrollment count
        setCourse(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            userProgress: Math.max((prev._count?.userProgress || 0) - 1, 0)
          }
        } : prev);
      }
    } catch (err) {
      console.error('Unenrollment failed:', err);
      const errorMessage = (err as ApiRequestError).response?.data?.message || t('course:errors.unenrollFailed');
      setError(errorMessage);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('course:notFound')}</h1>
          <p className="mt-2 text-gray-600">{t('course:notFoundDescription')}</p>
          <Link to="/courses" className="mt-4 inline-block">
            <Button>{t('common:backTo', { destination: t('course:title') })}</Button>
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
              {t('course:title')}
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
              <h3 className="text-sm font-medium text-red-800">{t('common:error')}</h3>
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
                    {t(`course:difficulty.${course.difficultyLevel}`)}
                  </span>
                  <span>{course.category}</span>
                  {course.estimatedHours && <span>{course.estimatedHours} {t('common:hour', { count: course.estimatedHours })}</span>}
                </div>
              </div>
            </div>

            {course.description && (
              <p className="text-gray-700 mb-4">{course.description}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {t('common:createdBy')} {course.creator.firstName} {course.creator.lastName}
              </span>
              <span>{course._count?.userProgress || 0} {t('common:student', { count: course._count?.userProgress || 0 })}</span>
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
                {isEnrolled ? t('course:unenroll') : t('course:enroll')}
              </Button>
            )}

            {!user && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  {t('course:signInToEnroll')}
                </p>
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    {t('common:signIn')}
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
          <h2 className="text-xl font-semibold text-gray-900">{t('course:content')}</h2>
          <span className="text-sm text-gray-500">
            {lessons.length} {t('common:lesson', { count: lessons.length })}
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