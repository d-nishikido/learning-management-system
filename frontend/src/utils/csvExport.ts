import type { 
  LearningStatsReport, 
  AccessHistoryRecord, 
  DetailedLearningHistory,
  MaterialBreakdown 
} from '@/types';

// Utility function to convert data to CSV format
export const convertToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Format date for CSV
const formatDateForCSV = (date: Date | string): string => {
  return new Date(date).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format minutes for CSV
const formatMinutesForCSV = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `0:${mins.toString().padStart(2, '0')}`;
};

// Export access history to CSV
export const exportAccessHistoryCSV = (
  accessHistory: AccessHistoryRecord[], 
  filename: string = 'access_history.csv'
): void => {
  const headers = [
    'accessedAt',
    'materialTitle',
    'resourceTitle', 
    'accessType',
    'sessionDuration',
    'ipAddress',
    'userAgent'
  ];
  
  const csvData = accessHistory.map(record => ({
    accessedAt: formatDateForCSV(record.accessedAt),
    materialTitle: record.material?.title || '',
    resourceTitle: record.resource?.title || '',
    accessType: record.accessType,
    sessionDuration: record.sessionDuration ? formatMinutesForCSV(record.sessionDuration) : '',
    ipAddress: record.ipAddress || '',
    userAgent: record.userAgent || ''
  }));

  const csvContent = convertToCSV(csvData, headers);
  downloadCSV(csvContent, filename);
};

// Export learning statistics report to CSV
export const exportLearningStatsCSV = (
  statsReport: LearningStatsReport,
  filename: string = 'learning_statistics.csv'
): void => {
  // Main statistics
  const mainStats = [
    { metric: 'User ID', value: statsReport.userId },
    { metric: 'Period Start', value: formatDateForCSV(statsReport.periodStart) },
    { metric: 'Period End', value: formatDateForCSV(statsReport.periodEnd) },
    { metric: 'Total Study Time', value: formatMinutesForCSV(statsReport.totalStudyTime) },
    { metric: 'Total Materials Accessed', value: statsReport.totalMaterialsAccessed },
    { metric: 'Unique Materials Accessed', value: statsReport.uniqueMaterialsAccessed },
    { metric: 'Average Daily Study Time', value: formatMinutesForCSV(Math.round(statsReport.averageDailyStudyTime)) },
    { metric: 'Longest Study Session', value: formatMinutesForCSV(statsReport.longestStudySession) },
    { metric: 'Shortest Study Session', value: formatMinutesForCSV(statsReport.shortestStudySession) },
    { metric: 'Most Used Access Type', value: statsReport.mostUsedAccessType }
  ];

  let csvContent = 'LEARNING STATISTICS SUMMARY\n\n';
  csvContent += convertToCSV(mainStats, ['metric', 'value']) + '\n\n';

  // Daily breakdown
  if (statsReport.dailyBreakdown.length > 0) {
    csvContent += 'DAILY BREAKDOWN\n';
    const dailyHeaders = ['date', 'studyTime', 'materialsAccessed', 'sessionsCount'];
    const dailyData = statsReport.dailyBreakdown.map(day => ({
      date: day.date,
      studyTime: formatMinutesForCSV(day.studyTime),
      materialsAccessed: day.materialsAccessed,
      sessionsCount: day.sessionsCount
    }));
    csvContent += convertToCSV(dailyData, dailyHeaders) + '\n\n';
  }

  // Hourly breakdown
  if (statsReport.hourlyBreakdown.length > 0) {
    csvContent += 'HOURLY BREAKDOWN\n';
    const hourlyHeaders = ['hour', 'accessCount', 'totalTime'];
    const hourlyData = statsReport.hourlyBreakdown.map(hour => ({
      hour: `${hour.hour}:00`,
      accessCount: hour.accessCount,
      totalTime: formatMinutesForCSV(hour.totalTime)
    }));
    csvContent += convertToCSV(hourlyData, hourlyHeaders) + '\n\n';
  }

  // Weekly breakdown
  if (statsReport.weeklyBreakdown.length > 0) {
    csvContent += 'WEEKLY BREAKDOWN\n';
    const weeklyHeaders = ['dayOfWeek', 'accessCount', 'totalTime'];
    const weeklyData = statsReport.weeklyBreakdown.map(week => ({
      dayOfWeek: week.dayOfWeek,
      accessCount: week.accessCount,
      totalTime: formatMinutesForCSV(week.totalTime)
    }));
    csvContent += convertToCSV(weeklyData, weeklyHeaders);
  }

  downloadCSV(csvContent, filename);
};

// Export material breakdown to CSV
export const exportMaterialBreakdownCSV = (
  materialBreakdown: MaterialBreakdown[],
  filename: string = 'material_breakdown.csv'
): void => {
  const headers = ['materialTitle', 'accessCount', 'totalTime', 'averageTime'];
  
  const csvData = materialBreakdown.map(material => ({
    materialTitle: material.materialTitle,
    accessCount: material.accessCount,
    totalTime: formatMinutesForCSV(material.totalTime),
    averageTime: formatMinutesForCSV(Math.round(material.totalTime / material.accessCount))
  }));

  const csvContent = convertToCSV(csvData, headers);
  downloadCSV(csvContent, filename);
};

// Export detailed learning history to CSV
export const exportDetailedHistoryCSV = (
  detailedHistory: DetailedLearningHistory,
  filename: string = 'detailed_learning_history.csv'
): void => {
  // Summary statistics
  const summary = [
    { metric: 'Total Accesses', value: detailedHistory.totalAccesses },
    { metric: 'Total Session Time', value: formatMinutesForCSV(detailedHistory.totalSessionTime) },
    { metric: 'Average Session Time', value: formatMinutesForCSV(Math.round(detailedHistory.averageSessionTime)) },
    { metric: 'Most Active Hour', value: `${detailedHistory.mostActiveHour}:00` },
    { metric: 'Most Active Day', value: detailedHistory.mostActiveDay }
  ];

  let csvContent = 'DETAILED LEARNING HISTORY SUMMARY\n\n';
  csvContent += convertToCSV(summary, ['metric', 'value']) + '\n\n';

  // Learning patterns
  if (detailedHistory.learningPatterns.length > 0) {
    csvContent += 'LEARNING PATTERNS\n';
    const patternHeaders = ['hourOfDay', 'dayOfWeek', 'accessCount', 'averageSessionDuration'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const patternData = detailedHistory.learningPatterns.map(pattern => ({
      hourOfDay: `${pattern.hourOfDay}:00`,
      dayOfWeek: dayNames[pattern.dayOfWeek],
      accessCount: pattern.accessCount,
      averageSessionDuration: formatMinutesForCSV(Math.round(pattern.averageSessionDuration))
    }));
    csvContent += convertToCSV(patternData, patternHeaders) + '\n\n';
  }

  // Material breakdown
  if (detailedHistory.materialBreakdown.length > 0) {
    csvContent += 'MATERIAL BREAKDOWN\n';
    const materialHeaders = ['materialTitle', 'accessCount', 'totalTime'];
    const materialData = detailedHistory.materialBreakdown.map(material => ({
      materialTitle: material.materialTitle,
      accessCount: material.accessCount,
      totalTime: formatMinutesForCSV(material.totalTime)
    }));
    csvContent += convertToCSV(materialData, materialHeaders) + '\n\n';
  }

  // Recent accesses
  if (detailedHistory.recentAccesses.length > 0) {
    csvContent += 'RECENT ACCESSES\n';
    const accessHeaders = ['accessedAt', 'materialTitle', 'resourceTitle', 'accessType', 'sessionDuration'];
    const accessData = detailedHistory.recentAccesses.map(access => ({
      accessedAt: formatDateForCSV(access.accessedAt),
      materialTitle: access.material?.title || '',
      resourceTitle: access.resource?.title || '',
      accessType: access.accessType,
      sessionDuration: access.sessionDuration ? formatMinutesForCSV(access.sessionDuration) : ''
    }));
    csvContent += convertToCSV(accessData, accessHeaders);
  }

  downloadCSV(csvContent, filename);
};