import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TimeSeriesDataPoint } from '@/types';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const { t } = useTranslation('progress');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}${t('chart.minutes')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}${t('chart.hours')}`;
    }
    return `${hours}${t('chart.hours')} ${remainingMinutes}${t('chart.minutes')}`;
  };

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: number; dataKey: string; color: string }>; 
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey === 'spentMinutes' 
                  ? formatMinutes(entry.value)
                  : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('chart.noData')}
      </div>
    );
  }

  // Calculate average for reference line
  const avgStudyTime = data.reduce((sum, point) => sum + point.spentMinutes, 0) / data.length;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => Math.round(value / 60) + 'h'}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={avgStudyTime} 
            stroke="#9ca3af" 
            strokeDasharray="5 5" 
            label={{ value: t('chart.average'), position: 'topRight' }}
          />
          <Line 
            type="monotone" 
            dataKey="spentMinutes" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#1d4ed8' }}
            name={t('chart.studyTime')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}