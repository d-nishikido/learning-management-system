import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import Progress from '../Progress';
import i18n from '../../i18n';
import { progressApi } from '../../services/api';
import type { ProgressSummary, TimeSeriesDataPoint } from '../../types';

// Mock the API
vi.mock('../../services/api', () => ({
  progressApi: {
    getProgressSummary: vi.fn(),
    getTimeSeriesData: vi.fn(),
  },
}));

// Mock the chart components
vi.mock('../../components/progress/ProgressChart', () => ({
  ProgressChart: () => <div data-testid="progress-chart">Progress Chart</div>,
}));

vi.mock('../../components/progress/TimeSeriesChart', () => ({
  TimeSeriesChart: () => <div data-testid="time-series-chart">Time Series Chart</div>,
}));

vi.mock('../../components/progress/CourseProgressChart', () => ({
  CourseProgressChart: () => <div data-testid="course-progress-chart">Course Progress Chart</div>,
}));

vi.mock('../../components/calendar/LearningCalendar', () => ({
  LearningCalendar: () => <div data-testid="learning-calendar">Learning Calendar</div>,
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

const mockTimeSeriesData: TimeSeriesDataPoint[] = [
  {
    date: '2024-01-01',
    spentMinutes: 120,
    completedMaterials: 3,
    progressRate: 85,
  },
  {
    date: '2024-01-02',
    spentMinutes: 90,
    completedMaterials: 2,
    progressRate: 90,
  },
];

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('Progress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    vi.mocked(progressApi.getProgressSummary).mockImplementation(() => new Promise(() => {}));
    vi.mocked(progressApi.getTimeSeriesData).mockImplementation(() => new Promise(() => {}));
    
    renderWithI18n(<Progress />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders progress data when loaded successfully', async () => {
    vi.mocked(progressApi.getProgressSummary).mockResolvedValue({
      success: true,
      data: mockSummary,
    });
    vi.mocked(progressApi.getTimeSeriesData).mockResolvedValue({
      success: true,
      data: mockTimeSeriesData,
    });
    
    renderWithI18n(<Progress />);
    
    await waitFor(() => {
      expect(screen.getByText('Learning Progress')).toBeInTheDocument();
    });
    
    expect(screen.getByText('7')).toBeInTheDocument(); // enrolled courses
    expect(screen.getByText('75.5%')).toBeInTheDocument(); // average progress
    expect(screen.getByText('20h')).toBeInTheDocument(); // total study time
    expect(screen.getByText('5')).toBeInTheDocument(); // current streak
    
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    expect(screen.getByTestId('time-series-chart')).toBeInTheDocument();
    expect(screen.getByTestId('course-progress-chart')).toBeInTheDocument();
    expect(screen.getByTestId('learning-calendar')).toBeInTheDocument();
  });

  it('displays error message when API fails', async () => {
    const errorMessage = 'Failed to fetch progress data';
    vi.mocked(progressApi.getProgressSummary).mockRejectedValue(new Error(errorMessage));
    vi.mocked(progressApi.getTimeSeriesData).mockRejectedValue(new Error(errorMessage));
    
    renderWithI18n(<Progress />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});