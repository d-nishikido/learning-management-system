import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LearningPatternChart } from './LearningPatternChart';
import { progressApi } from '@/services/api';
import { 
  exportAccessHistoryCSV,
  exportLearningStatsCSV,
  exportMaterialBreakdownCSV,
  exportDetailedHistoryCSV
} from '@/utils/csvExport';
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
  const { t } = useTranslation('progress');
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

  const loadLearningHistory = useCallback(async () => {
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
      setError(t('learningHistory.error'));
      console.error('Error loading learning history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, t]);

  useEffect(() => {
    loadLearningHistory();
  }, [dateRange, loadLearningHistory]);

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
      setError(t('learningHistory.generateReportError'));
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Export functions
  const handleExportAccessHistory = () => {
    if (accessHistory?.data) {
      const filename = `access_history_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      exportAccessHistoryCSV(accessHistory.data, filename);
    }
  };

  const handleExportStatsReport = () => {
    if (statsReport) {
      const filename = `learning_statistics_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      exportLearningStatsCSV(statsReport, filename);
    }
  };

  const handleExportMaterialBreakdown = () => {
    if (patterns?.materialBreakdown) {
      const filename = `material_breakdown_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      exportMaterialBreakdownCSV(patterns.materialBreakdown, filename);
    }
  };

  const handleExportDetailedHistory = () => {
    if (detailedHistory) {
      const filename = `detailed_history_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      exportDetailedHistoryCSV(detailedHistory, filename);
    }
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}${t('learningHistory.timeFormat.hours')} ${mins}${t('learningHistory.timeFormat.minutes')}` : `${mins}${t('learningHistory.timeFormat.minutes')}`;
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
      <div className="flex items-center justify-center p-8" data-testid="loading-spinner">
        <LoadingSpinner />
        <span className="ml-2">{t('learningHistory.loading')}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('learningHistory.title')}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">{t('learningHistory.dateRange.from')}</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">{t('learningHistory.dateRange.to')}</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={generateReport} variant="outline" size="sm">
            {t('learningHistory.generateReport')}
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
            >
              {t('learningHistory.exportCSV')}
            </Button>
            <div 
              id="export-menu"
              className="hidden absolute right-0 mt-2 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={handleExportDetailedHistory}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!detailedHistory}
                >
                  {t('learningHistory.export.overviewSummary')}
                </button>
                <button
                  onClick={handleExportAccessHistory}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!accessHistory}
                >
                  {t('learningHistory.export.accessHistory')}
                </button>
                <button
                  onClick={handleExportMaterialBreakdown}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!patterns}
                >
                  {t('learningHistory.export.materialBreakdown')}
                </button>
                <button
                  onClick={handleExportStatsReport}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={!statsReport}
                >
                  {t('learningHistory.export.fullReport')}
                </button>
              </div>
            </div>
          </div>
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
        <nav className="-mb-px flex space-x-8" role="tablist">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'history', label: 'Access History' },
            { key: 'patterns', label: 'Learning Patterns' },
            { key: 'report', label: 'Detailed Report' }
          ].map(tab => (
            <button
              key={tab.key}
              role="tab"
              onClick={() => setActiveTab(tab.key as 'overview' | 'history' | 'patterns' | 'report')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t(`learningHistory.tabs.${tab.key}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && detailedHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">{t('learningHistory.overview.totalAccesses')}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {detailedHistory.totalAccesses}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">{t('learningHistory.overview.totalStudyTime')}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatMinutes(detailedHistory.totalSessionTime)}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">{t('learningHistory.overview.averageSession')}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {formatMinutes(Math.round(detailedHistory.averageSessionTime))}
              </dd>
            </div>
          </Card>
          
          <Card>
            <div className="p-4">
              <dt className="text-sm font-medium text-gray-500">{t('learningHistory.overview.mostActive')}</dt>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('learningHistory.accessHistory.title')}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('learningHistory.accessHistory.dateTime')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('learningHistory.accessHistory.material')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('learningHistory.accessHistory.accessType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('learningHistory.accessHistory.duration')}
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
                        {access.material?.title || access.resource?.title || t('learningHistory.accessHistory.unknown')}
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
          {/* Charts Section */}
          <LearningPatternChart
            learningPatterns={patterns.learningPatterns || []}
            materialBreakdown={patterns.materialBreakdown}
            hourlyBreakdown={patterns.hourlyBreakdown}
            weeklyBreakdown={patterns.weeklyBreakdown}
          />

          {/* Summary Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('learningHistory.patterns.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{t('learningHistory.patterns.mostActiveTimes')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('learningHistory.patterns.hour')}: {patterns.mostActiveHour}:00 | {t('learningHistory.patterns.day')}: {patterns.mostActiveDay}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('learningHistory.patterns.materialBreakdown')}</h3>
              <div className="space-y-3">
                {patterns.materialBreakdown.slice(0, 10).map((material) => (
                  <div key={material.materialId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">{material.materialTitle}</span>
                    <div className="text-sm text-gray-500">
                      {material.accessCount} {t('learningHistory.patterns.accesses')} • {formatMinutes(material.totalTime)}
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
            <div className="p-6" data-testid="report-stats">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('learningHistory.report.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.totalStudyTime')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.totalStudyTime)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.materialsAccessed')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.totalMaterialsAccessed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.uniqueMaterials')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.uniqueMaterialsAccessed}
                    </dd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.dailyAverage')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(Math.round(statsReport.averageDailyStudyTime))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.longestSession')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.longestStudySession)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.shortestSession')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatMinutes(statsReport.shortestStudySession)}
                    </dd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.mostUsedAccessType')}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {statsReport.mostUsedAccessType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('learningHistory.report.reportPeriod')}</dt>
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