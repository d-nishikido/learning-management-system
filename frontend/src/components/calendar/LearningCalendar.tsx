import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { progressApi } from '@/services/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { StreakStats } from '@/types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasActivity: boolean;
  studyMinutes: number;
  materialsCompleted: number;
  isToday: boolean;
}

export function LearningCalendar() {
  const { t } = useTranslation('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get streak stats and time series data for the current month
        const [streakResponse, timeSeriesResponse] = await Promise.all([
          progressApi.getStreakStats(),
          progressApi.getTimeSeriesData({
            startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
            endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
            interval: 'day'
          })
        ]);

        setStreakStats(streakResponse.data);
        
        // Generate calendar days
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();
        
        // Get first day of month and adjust for Monday start
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        startDate.setDate(1 - dayOfWeek);
        
        // Generate 42 days (6 weeks)
        const days: CalendarDay[] = [];
        const activityMap = new Map<string, { studyMinutes: number; materialsCompleted: number }>();
        
        // Map time series data
        timeSeriesResponse.data.forEach(point => {
          const dateKey = point.date;
          activityMap.set(dateKey, {
            studyMinutes: point.spentMinutes,
            materialsCompleted: point.completedMaterials
          });
        });
        
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          const dateKey = date.toISOString().split('T')[0];
          const activity = activityMap.get(dateKey);
          
          days.push({
            date: new Date(date),
            isCurrentMonth: date.getMonth() === month,
            hasActivity: Boolean(activity && activity.studyMinutes > 0),
            studyMinutes: activity?.studyMinutes || 0,
            materialsCompleted: activity?.materialsCompleted || 0,
            isToday: date.toDateString() === today.toDateString()
          });
        }
        
        setCalendarDays(days);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentDate]);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}${t('calendar.minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}${t('calendar.hours')}`;
    }
    return `${hours}${t('calendar.hours')} ${remainingMinutes}${t('calendar.minutes')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const weekdays = [
    t('calendar.weekdays.mon'),
    t('calendar.weekdays.tue'),
    t('calendar.weekdays.wed'),
    t('calendar.weekdays.thu'),
    t('calendar.weekdays.fri'),
    t('calendar.weekdays.sat'),
    t('calendar.weekdays.sun'),
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <div className="text-center">
          <p className="text-red-600 mb-2">{t('error')}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('calendar.previousMonth')}
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('calendar.nextMonth')}
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Streak Stats */}
      {streakStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{streakStats.currentStreak}</div>
            <div className="text-sm text-gray-600">{t('calendar.currentStreak')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{streakStats.longestStreak}</div>
            <div className="text-sm text-gray-600">{t('calendar.longestStreak')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{streakStats.totalStudyDays}</div>
            <div className="text-sm text-gray-600">{t('calendar.activeDays')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{Math.round(streakStats.averageMinutesPerDay / 60)}h</div>
            <div className="text-sm text-gray-600">{t('calendar.averageDaily')}</div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekdays.map((day, index) => (
            <div key={index} className="p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                relative p-3 h-16 border-b border-r border-gray-100 last:border-r-0
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${day.isToday ? 'bg-blue-50' : ''}
                ${day.hasActivity ? 'hover:bg-green-50' : 'hover:bg-gray-50'}
                transition-colors cursor-pointer group
              `}
              title={day.hasActivity ? 
                `${formatMinutes(day.studyMinutes)}, ${day.materialsCompleted} ${t('calendar.materialsCompleted')}` : 
                t('calendar.noActivity')
              }
            >
              <div className={`
                text-sm font-medium
                ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${day.isToday ? 'text-blue-600 font-bold' : ''}
              `}>
                {day.date.getDate()}
              </div>
              
              {day.hasActivity && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className={`
                    h-1 rounded-full
                    ${day.studyMinutes >= 60 ? 'bg-green-500' : 
                      day.studyMinutes >= 30 ? 'bg-yellow-500' : 
                      'bg-blue-500'}
                  `} />
                </div>
              )}
              
              {day.isToday && (
                <div className="absolute top-1 right-1">
                  <div className="h-2 w-2 bg-blue-600 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-blue-500 rounded-full" />
          <span>{t('calendar.legend.light')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-yellow-500 rounded-full" />
          <span>{t('calendar.legend.moderate')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-green-500 rounded-full" />
          <span>{t('calendar.legend.intensive')}</span>
        </div>
      </div>
    </div>
  );
}