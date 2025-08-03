import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MaterialList } from '@/components/materials/MaterialList';
import { lessonApi, courseApi } from '@/services/api';
import type { Lesson, Course, ApiRequestError } from '@/types';

export function LessonDetail() {
  const { courseId, id } = useParams<{ courseId: string; id: string }>();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseIdNum = courseId ? parseInt(courseId, 10) : null;
  const lessonIdNum = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!courseIdNum || !lessonIdNum) return;

    const loadLessonData = async () => {
      try {
        setError(null);
        
        // Load lesson details
        const lessonResponse = await lessonApi.getById(courseIdNum, lessonIdNum);
        if (lessonResponse.success && lessonResponse.data) {
          setLesson(lessonResponse.data);
        }

        // Load course details
        const courseResponse = await courseApi.getById(courseIdNum);
        if (courseResponse.success && courseResponse.data) {
          setCourse(courseResponse.data);
        }

        // Load all lessons for navigation
        const lessonsResponse = await lessonApi.getByCourse(courseIdNum, { 
          isPublished: true 
        });
        if (lessonsResponse.success && lessonsResponse.data) {
          setAllLessons(lessonsResponse.data.lessons.sort((a, b) => a.sortOrder - b.sortOrder));
        }

      } catch (err) {
        setError((err as ApiRequestError).response?.data?.message || 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, [courseIdNum, lessonIdNum]);

  // Find current lesson index and adjacent lessons
  const currentLessonIndex = allLessons.findIndex(l => l.id === lessonIdNum);
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const navigateToLesson = (targetLessonId: number) => {
    navigate(`/courses/${courseIdNum}/lessons/${targetLessonId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lesson not found</h1>
          <p className="mt-2 text-gray-600">The lesson you're looking for doesn't exist.</p>
          <Link to={`/courses/${courseIdNum}`} className="mt-4 inline-block">
            <Button>Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <li>
            <Link to={`/courses/${courseIdNum}`} className="hover:text-gray-700">
              {course.title}
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li className="text-gray-900">{lesson.title}</li>
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

      {/* Lesson Header */}
      <Card className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {lesson.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Lesson {currentLessonIndex + 1} of {allLessons.length}</span>
              {lesson.estimatedMinutes && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {lesson.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>
          
          {!lesson.isPublished && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Draft
            </span>
          )}
        </div>

        {lesson.description && (
          <p className="text-gray-700">{lesson.description}</p>
        )}
      </Card>

      {/* Lesson Content */}
      <Card className="mb-8">
        <div className="prose max-w-none">
          {lesson.content ? (
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>This lesson doesn't have any content yet.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Learning Materials */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">学習教材</h2>
        <MaterialList courseId={courseIdNum} lessonId={lessonIdNum} />
      </Card>

      {/* Navigation */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            {previousLesson ? (
              <Button
                variant="outline"
                onClick={() => navigateToLesson(previousLesson.id)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Lesson
              </Button>
            ) : (
              <div />
            )}
          </div>

          <Link to={`/courses/${courseIdNum}`}>
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Course Overview
            </Button>
          </Link>

          <div>
            {nextLesson ? (
              <Button
                variant="primary"
                onClick={() => navigateToLesson(nextLesson.id)}
              >
                Next Lesson
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                Course Complete
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}