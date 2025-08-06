import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ProgressSummary } from '@/types';

interface ProgressChartProps {
  summary: ProgressSummary;
}

const COLORS = {
  completed: '#10b981', // green-500
  inProgress: '#f59e0b', // amber-500
  notStarted: '#6b7280', // gray-500
};

export function ProgressChart({ summary }: ProgressChartProps) {
  const { t } = useTranslation('progress');

  const data = [
    {
      name: t('chart.completed'),
      value: summary.completedCourses,
      color: COLORS.completed,
    },
    {
      name: t('chart.inProgress'),
      value: summary.enrolledCourses - summary.completedCourses,
      color: COLORS.inProgress,
    },
    {
      name: t('chart.notStarted'),
      value: Math.max(0, summary.totalCourses - summary.enrolledCourses),
      color: COLORS.notStarted,
    },
  ].filter(item => item.value > 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for slices less than 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {t('chart.courses')}: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('chart.noData')}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '14px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}