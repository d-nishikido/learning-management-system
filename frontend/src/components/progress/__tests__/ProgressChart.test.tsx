import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { ProgressChart } from '../ProgressChart';
import i18n from '../../../i18n';
import type { ProgressSummary } from '../../../types';

// Mock recharts components
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: { data: Array<unknown> }) => <div data-testid="pie" data-length={data.length} />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockSummary: ProgressSummary = {
  totalCourses: 10,
  enrolledCourses: 7,
  completedCourses: 3,
  totalLessons: 50,
  completedLessons: 20,
  totalMaterials: 150,
  completedMaterials: 60,
  totalSpentMinutes: 1200,
  averageProgress: 75.5,
  streakDays: 5,
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('ProgressChart', () => {
  it('renders chart with progress data', () => {
    renderWithI18n(<ProgressChart summary={mockSummary} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('displays correct data segments', () => {
    renderWithI18n(<ProgressChart summary={mockSummary} />);
    
    const pieElement = screen.getByTestId('pie');
    // Should have 3 segments: completed (3), in progress (4), not started (3)
    expect(pieElement).toHaveAttribute('data-length', '3');
  });

  it('shows no data message when all values are zero', () => {
    const emptySummary: ProgressSummary = {
      ...mockSummary,
      totalCourses: 0,
      enrolledCourses: 0,
      completedCourses: 0,
    };
    
    renderWithI18n(<ProgressChart summary={emptySummary} />);
    
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});