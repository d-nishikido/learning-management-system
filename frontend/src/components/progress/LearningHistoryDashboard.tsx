import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { progressApi } from '@/services/api';
import type { 
  DetailedLearningHistory, 
  AccessHistoryRecord, 
  LearningStatsReport,
  LearningPatternsResponse,
  PaginatedResponse 
} from '@/types';

interface LearningHistoryDashboardProps {
  className?: string;
}

export const LearningHistoryDashboard: React.FC<LearningHistoryDashboardProps> = ({
  className = ''
}) => {
  const [detailedHistory, setDetailedHistory] = useState<DetailedLearningHistory | null>(null);
  const [accessHistory, setAccessHistory] = useState<PaginatedResponse<AccessHistoryRecord> | null>(null);
  const [statsReport, setStatsReport] = useState<LearningStatsReport | null>(null);
  const [patterns, setPatterns] = useState<LearningPatternsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'patterns' | 'report'>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadLearningHistory();
  }, [dateRange]);

  const loadLearningHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [detailedRes, accessRes, patternsRes] = await Promise.all([
        progressApi.getDetailedHistory({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }),
        progressApi.getAccessHistory({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 10
        }),
        progressApi.getLearningPatterns({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      ]);

      if (detailedRes.success) setDetailedHistory(detailedRes.data!);
      if (accessRes.success) setAccessHistory(accessRes.data!);
      if (patternsRes.success) setPatterns(patternsRes.data!);
    } catch (err) {
      setError('Failed to load learning history data');
      console.error('Error loading learning history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setIsLoading(true);
      const reportRes = await progressApi.generateStatsReport(
        dateRange.startDate,
        dateRange.endDate
      );
      
      if (reportRes.success) {
        setStatsReport(reportRes.data!);
        setActiveTab('report');
      }
    } catch (err) {
      setError('Failed to generate stats report');
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
        <span className="ml-2">Loading learning history...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Learning History</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={generateReport} variant="outline" size="sm">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'history', label: 'Access History' },
            { key: 'patterns', label: 'Learning Patterns' },
            { key: 'report', label: 'Detailed Report' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && detailedHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">Total Accesses</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {detailedHistory.totalAccesses}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">Total Study Time</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatMinutes(detailedHistory.totalSessionTime)}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">Average Session</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatMinutes(Math.round(detailedHistory.averageSessionTime))}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">Most Active</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {detailedHistory.mostActiveHour}:00 on {detailedHistory.mostActiveDay}
              </dd>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && accessHistory && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Access History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessHistory.data.map((access) => (
                    <tr key={access.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(access.accessedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {access.material?.title || access.resource?.title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          access.accessType === 'VIEW' ? 'bg-blue-100 text-blue-800' :
                          access.accessType === 'DOWNLOAD' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {access.accessType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {access.sessionDuration ? formatMinutes(access.sessionDuration) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'patterns' && patterns && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Most Active Times</h4>
                  <p className="text-sm text-gray-600">
                    Hour: {patterns.mostActiveHour}:00 | Day: {patterns.mostActiveDay}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Material Breakdown</h3>
              <div className="space-y-3">
                {patterns.materialBreakdown.slice(0, 10).map((material) => (
                  <div key={material.materialId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">{material.materialTitle}</span>
                    <div className="text-sm text-gray-500">
                      {material.accessCount} accesses • {formatMinutes(material.totalTime)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'report' && statsReport && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Statistics Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Study Time</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.totalStudyTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Materials Accessed</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.totalMaterialsAccessed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unique Materials</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.uniqueMaterialsAccessed}
                    </dd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Daily Average</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(Math.round(statsReport.averageDailyStudyTime))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Longest Session</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.longestStudySession)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Shortest Session</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.shortestStudySession)}
                    </dd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Most Used Access Type</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.mostUsedAccessType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Report Period</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(statsReport.periodStart)} - {formatDate(statsReport.periodEnd)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};