import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { LearningPattern, MaterialBreakdown, HourlyBreakdown, WeeklyBreakdown } from '@/types';

interface LearningPatternChartProps {
  learningPatterns: LearningPattern[];
  materialBreakdown: MaterialBreakdown[];
  hourlyBreakdown?: HourlyBreakdown[];
  weeklyBreakdown?: WeeklyBreakdown[];
}

export const LearningPatternChart: React.FC<LearningPatternChartProps> = ({
  learningPatterns,
  materialBreakdown,
  hourlyBreakdown = [],
  weeklyBreakdown = []
}) => {
  const { t } = useTranslation('progress');
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}${t('learningHistory.timeFormat.hours')} ${mins}${t('learningHistory.timeFormat.minutes')}` : `${mins}${t('learningHistory.timeFormat.minutes')}`;
  };

  // Prepare hourly data for chart
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyBreakdown.find(h => h.hour === hour);
    return {
      hour: `${hour}:00`,
      accessCount: data?.accessCount || 0,
      totalTime: data?.totalTime || 0
    };
  });

  // Prepare weekly data for chart
  const weeklyData = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map(day => {
    const data = weeklyBreakdown.find(w => w.dayOfWeek === day);
    return {
      day: day.substring(0, 3), // Abbreviated day names
      accessCount: data?.accessCount || 0,
      totalTime: data?.totalTime || 0
    };
  });

  // Prepare top materials data for pie chart
  const topMaterials = materialBreakdown.slice(0, 8).map((material, index) => ({
    name: material.materialTitle.length > 20 
      ? `${material.materialTitle.substring(0, 20)}...` 
      : material.materialTitle,
    value: material.accessCount,
    totalTime: material.totalTime
  }));

  // Colors for pie chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow">
          <p className="font-semibold">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'totalTime' 
                ? `${entry.name}: ${formatMinutes(entry.value)}`
                : `${entry.name}: ${entry.value}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MaterialTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow">
          <p className="font-semibold">{data.name}</p>
          <p style={{ color: payload[0].color }}>
            Accesses: {data.value}
          </p>
          <p style={{ color: payload[0].color }}>
            Total Time: {formatMinutes(data.totalTime)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Hourly Access Pattern */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {t('learningHistory.charts.hourlyPattern')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
              interval={1}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="accessCount" 
              fill="#3B82F6" 
              name={t('learningHistory.charts.accessCount')}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Learning Pattern */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {t('learningHistory.charts.weeklyPattern')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="accessCount" 
              stroke="#10B981" 
              strokeWidth={3}
              name={t('learningHistory.charts.accessCount')}
              dot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalTime" 
              stroke="#F59E0B" 
              strokeWidth={3}
              name={t('learningHistory.charts.studyTime')}
              dot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Material Usage Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {t('learningHistory.charts.topMaterials')}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topMaterials}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topMaterials.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<MaterialTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend for pie chart */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">{t('learningHistory.charts.materials')}</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {topMaterials.map((material, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700 flex-1">{material.name}</span>
                  <span className="text-gray-500">
                    {material.value} {t('learningHistory.patterns.accesses')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Material Breakdown Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {t('learningHistory.charts.materialComparison')}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={materialBreakdown.slice(0, 10)}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="materialTitle"
              width={100}
              tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="accessCount" 
              fill="#6366F1" 
              name={t('learningHistory.charts.accessCount')}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};