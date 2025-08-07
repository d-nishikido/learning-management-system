import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LearningHistoryDashboard } from '../LearningHistoryDashboard';
import { progressApi } from '@/services/api';
import '@testing-library/jest-dom';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'learningHistory.title': '学習履歴',
        'learningHistory.loading': '学習履歴を読み込み中...',
        'learningHistory.error': '学習履歴データの読み込みに失敗しました',
        'learningHistory.dateRange.from': '開始日:',
        'learningHistory.dateRange.to': '終了日:',
        'learningHistory.generateReport': 'レポート生成',
        'learningHistory.exportCSV': 'CSV出力',
        'learningHistory.tabs.overview': '概要',
        'learningHistory.tabs.history': 'アクセス履歴',
        'learningHistory.tabs.patterns': '学習パターン',
        'learningHistory.tabs.report': '詳細レポート',
        'learningHistory.overview.totalAccesses': '総アクセス数',
        'learningHistory.overview.totalStudyTime': '総学習時間',
        'learningHistory.overview.averageSession': '平均セッション時間',
        'learningHistory.overview.mostActive': '最も活発な時間',
        'learningHistory.timeFormat.hours': '時間',
        'learningHistory.timeFormat.minutes': '分'
      };
      return translations[key] || key;
    },
  }),
}));

// Mock API module
jest.mock('@/services/api', () => ({
  progressApi: {
    getDetailedHistory: jest.fn(),
    getAccessHistory: jest.fn(),
    getLearningPatterns: jest.fn(),
    generateStatsReport: jest.fn(),
  },
}));

// Mock CSV export utilities
jest.mock('@/utils/csvExport', () => ({
  exportAccessHistoryCSV: jest.fn(),
  exportLearningStatsCSV: jest.fn(),
  exportMaterialBreakdownCSV: jest.fn(),
  exportDetailedHistoryCSV: jest.fn(),
}));

const mockedProgressApi = progressApi as jest.Mocked<typeof progressApi>;

const mockDetailedHistory = {
  totalAccesses: 142,
  totalSessionTime: 1820,
  averageSessionTime: 28.5,
  mostActiveHour: 14,
  mostActiveDay: 'Thursday'
};

const mockAccessHistory = {
  data: [
    {
      id: 1,
      materialId: 1,
      accessedAt: '2025-01-15T14:30:00Z',
      accessType: 'VIEW',
      sessionDuration: 45,
      material: { title: 'JavaScript基礎' }
    },
    {
      id: 2,
      materialId: 2,
      accessedAt: '2025-01-15T16:00:00Z',
      accessType: 'DOWNLOAD',
      sessionDuration: 12,
      material: { title: 'React入門' }
    }
  ],
  total: 2,
  page: 1,
  limit: 10
};

const mockPatterns = {
  materialBreakdown: [
    { materialId: 1, materialTitle: 'JavaScript基礎', accessCount: 45, totalTime: 300 },
    { materialId: 2, materialTitle: 'React入門', accessCount: 38, totalTime: 250 }
  ],
  learningPatterns: [
    { date: '2025-01-15', accessCount: 5, totalTime: 90 }
  ],
  hourlyBreakdown: [
    { hour: 14, accessCount: 25, totalTime: 120 }
  ],
  weeklyBreakdown: [
    { day: 'Thursday', accessCount: 35, totalTime: 180 }
  ],
  mostActiveHour: 14,
  mostActiveDay: 'Thursday'
};

describe('LearningHistoryDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API responses
    mockedProgressApi.getDetailedHistory.mockResolvedValue({
      success: true,
      data: mockDetailedHistory
    });
    
    mockedProgressApi.getAccessHistory.mockResolvedValue({
      success: true,
      data: mockAccessHistory
    });
    
    mockedProgressApi.getLearningPatterns.mockResolvedValue({
      success: true,
      data: mockPatterns
    });
  });

  it('renders loading state initially', () => {
    render(<LearningHistoryDashboard />);
    
    expect(screen.getByText('学習履歴を読み込み中...')).toBeInTheDocument();
  });

  it('renders dashboard with data after loading', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    // Check if overview data is displayed
    expect(screen.getByText('142')).toBeInTheDocument(); // Total accesses
    expect(screen.getByText('30時間 20分')).toBeInTheDocument(); // Total study time formatted
  });

  it('displays tab navigation correctly', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    // Check all tabs are present
    expect(screen.getByRole('tab', { name: '概要' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'アクセス履歴' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '学習パターン' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '詳細レポート' })).toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    // Click on Access History tab
    const historyTab = screen.getByRole('tab', { name: 'アクセス履歴' });
    fireEvent.click(historyTab);
    
    // Should display access history table
    expect(screen.getByText('最近のアクセス履歴')).toBeInTheDocument();
    expect(screen.getByText('JavaScript基礎')).toBeInTheDocument();
    expect(screen.getByText('React入門')).toBeInTheDocument();
  });

  it('handles date range changes', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    const startDateInput = screen.getAllByDisplayValue(/^\d{4}-\d{2}-\d{2}$/)[0];
    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
    
    // Should trigger API call with new date range
    await waitFor(() => {
      expect(mockedProgressApi.getDetailedHistory).toHaveBeenCalledWith({
        startDate: '2025-01-01',
        endDate: expect.any(String)
      });
    });
  });

  it('generates report when button is clicked', async () => {
    const mockStatsReport = {
      totalStudyTime: 1820,
      totalMaterialsAccessed: 142,
      uniqueMaterialsAccessed: 12,
      averageDailyStudyTime: 26.1,
      longestStudySession: 85,
      shortestStudySession: 5,
      mostUsedAccessType: 'VIEW',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-15'
    };
    
    mockedProgressApi.generateStatsReport.mockResolvedValue({
      success: true,
      data: mockStatsReport
    });
    
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    const generateButton = screen.getByText('レポート生成');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockedProgressApi.generateStatsReport).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    mockedProgressApi.getDetailedHistory.mockRejectedValue(new Error('API Error'));
    mockedProgressApi.getAccessHistory.mockRejectedValue(new Error('API Error'));
    mockedProgressApi.getLearningPatterns.mockRejectedValue(new Error('API Error'));
    
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴データの読み込みに失敗しました')).toBeInTheDocument();
    });
  });

  it('displays proper time formatting', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    // Check that time is formatted correctly (1820 minutes = 30h 20m)
    expect(screen.getByText('30時間 20分')).toBeInTheDocument();
  });

  it('shows patterns tab content correctly', async () => {
    render(<LearningHistoryDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('学習履歴')).toBeInTheDocument();
    });
    
    // Switch to patterns tab
    const patternsTab = screen.getByRole('tab', { name: '学習パターン' });
    fireEvent.click(patternsTab);
    
    // Should show patterns data
    expect(screen.getByText('学習パターン')).toBeInTheDocument();
    expect(screen.getByText('最も活発な時間帯')).toBeInTheDocument();
  });
});