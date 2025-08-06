import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { progressApi } from '@/services/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { ProgressWithDetails } from '@/types';

interface CourseProgress {
  courseName: string;
  progress: number;
  completedMaterials: number;
  totalMaterials: number;
}

export function CourseProgressChart() {
  const { t } = useTranslation('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<CourseProgress[]>([]);

  useEffect(() => {
    const fetchCourseProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await progressApi.getMyProgress({
          page: 1,
          limit: 100, // Get all courses
        });

        // Group by course and calculate progress
        const courseMap = new Map<number, CourseProgress>();

        response.data.data.forEach((progress: ProgressWithDetails) => {
          const courseId = progress.course.id;
          const courseName = progress.course.title.length > 20 
            ? progress.course.title.substring(0, 20) + '...' 
            : progress.course.title;

          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              courseName,
              progress: 0,
              completedMaterials: 0,
              totalMaterials: 0,
            });
          }

          const courseProgress = courseMap.get(courseId)!;
          courseProgress.totalMaterials++;
          
          if (progress.isCompleted) {
            courseProgress.completedMaterials++;
          }
        });

        // Calculate progress percentage for each course
        const courseProgressData = Array.from(courseMap.values()).map(course => ({
          ...course,
          progress: course.totalMaterials > 0 
            ? Math.round((course.completedMaterials / course.totalMaterials) * 100)
            : 0,
        }));

        // Sort by progress descending
        courseProgressData.sort((a, b) => b.progress - a.progress);

        setCourseData(courseProgressData.slice(0, 10)); // Show top 10 courses
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course progress');
        console.error('Error fetching course progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, []);

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ payload: CourseProgress }>; 
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-gray-600">
            {t('chart.progress')}: {data.progress}%
          </p>
          <p className="text-sm text-gray-600">
            {t('chart.completed')}: {data.completedMaterials}/{data.totalMaterials} {t('chart.materials')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <p className="text-red-600 mb-2">{t('error')}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (courseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('chart.noCourseData')}
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={courseData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="courseName" 
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: '%', angle: 0, position: 'insideTop' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="progress" 
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}