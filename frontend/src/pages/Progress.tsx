import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common';
import { ProgressChart } from '@/components/progress/ProgressChart';
import { TimeSeriesChart } from '@/components/progress/TimeSeriesChart';
import { CourseProgressChart } from '@/components/progress/CourseProgressChart';
import { LearningCalendar } from '@/components/calendar/LearningCalendar';
import { LearningHistoryDashboard } from '@/components/progress/LearningHistoryDashboard';
import { progressApi } from '@/services/api';
import type { ProgressSummary, TimeSeriesDataPoint } from '@/types';

export default function Progress() {
  const { t } = useTranslation('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryResponse, timeSeriesResponse] = await Promise.all([
          progressApi.getProgressSummary(),
          progressApi.getTimeSeriesData({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            interval: 'day'
          })
        ]);

        setSummary(summaryResponse.data);
        setTimeSeriesData(timeSeriesResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{t('error')}</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {t('subtitle')}
        </p>
      </section>

      {/* Progress Summary Stats */}
      {summary && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">{summary.enrolledCourses}</div>
            <div className="text-sm text-gray-600">{t('stats.enrolledCourses')}</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">{summary.averageProgress.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">{t('stats.averageProgress')}</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">{Math.floor(summary.totalSpentMinutes / 60)}h</div>
            <div className="text-sm text-gray-600">{t('stats.totalStudyTime')}</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">{summary.streakDays}</div>
            <div className="text-sm text-gray-600">{t('stats.currentStreak')}</div>
          </Card>
        </section>
      )}

      {/* Progress Charts Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sections.progressCharts')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Progress Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.overallProgress')}</h3>
            {summary && <ProgressChart summary={summary} />}
          </Card>

          {/* Time Series Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.studyTimeProgress')}</h3>
            <TimeSeriesChart data={timeSeriesData} />
          </Card>
        </div>
      </section>

      {/* Course Progress Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sections.courseProgress')}</h2>
        <Card>
          <CourseProgressChart />
        </Card>
      </section>

      {/* Learning Calendar Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sections.learningCalendar')}</h2>
        <Card>
          <LearningCalendar />
        </Card>
      </section>

      {/* Learning History Dashboard Section */}
      <section>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('LearningHistoryDashboard Error:', error, errorInfo);
          }}
        >
          <LearningHistoryDashboard />
        </ErrorBoundary>
      </section>
    </div>
  );
}