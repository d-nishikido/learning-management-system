import { test, expect } from '@fixtures/auth';
import { ProgressPage } from '@pages/ProgressPage';
import { testUsers } from '@fixtures/users';
import { setupTestUser, waitForAPIResponse } from '@utils/test-helpers';

test.describe('Learning History Dashboard', () => {
  let progressPage: ProgressPage;

  test.beforeEach(async ({ page }) => {
    progressPage = new ProgressPage(page);
    await setupTestUser(page, 'user1');
    
    // Mock the learning history API responses
    await page.route('**/api/v1/learning-history*', async route => {
      const url = route.request().url();
      
      if (url.includes('summary')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalAccesses: 142,
              totalStudyTime: 1820, // minutes
              averageSessionTime: 28,
              mostActiveHour: 14
            }
          })
        });
      } else if (url.includes('access-history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                materialId: 1,
                materialTitle: 'JavaScript基礎',
                accessedAt: '2025-01-15T14:30:00Z',
                accessType: 'VIEW',
                duration: 45,
                createdAt: '2025-01-15T14:30:00Z'
              },
              {
                id: 2,
                materialId: 2,
                materialTitle: 'React入門',
                accessedAt: '2025-01-15T16:00:00Z',
                accessType: 'DOWNLOAD',
                duration: 12,
                createdAt: '2025-01-15T16:00:00Z'
              },
              {
                id: 3,
                materialId: 3,
                materialTitle: 'Node.js応用',
                accessedAt: '2025-01-15T19:15:00Z',
                accessType: 'COMPLETION',
                duration: 60,
                createdAt: '2025-01-15T19:15:00Z'
              }
            ]
          })
        });
      } else if (url.includes('patterns')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              hourlyPattern: [
                { hour: 9, accesses: 12 },
                { hour: 10, accesses: 18 },
                { hour: 11, accesses: 15 },
                { hour: 14, accesses: 25 },
                { hour: 15, accesses: 22 },
                { hour: 16, accesses: 19 },
                { hour: 19, accesses: 14 },
                { hour: 20, accesses: 17 }
              ],
              weeklyPattern: [
                { day: 'Monday', accesses: 28 },
                { day: 'Tuesday', accesses: 32 },
                { day: 'Wednesday', accesses: 25 },
                { day: 'Thursday', accesses: 35 },
                { day: 'Friday', accesses: 22 }
              ],
              materialBreakdown: [
                { materialId: 1, title: 'JavaScript基礎', accesses: 45 },
                { materialId: 2, title: 'React入門', accesses: 38 },
                { materialId: 3, title: 'Node.js応用', accesses: 32 },
                { materialId: 4, title: 'TypeScript実践', accesses: 27 }
              ]
            }
          })
        });
      } else if (url.includes('report')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalStudyTime: 1820,
              materialsAccessed: 142,
              uniqueMaterials: 12,
              dailyAverage: 26.1,
              longestSession: 85,
              shortestSession: 5,
              mostUsedAccessType: 'VIEW',
              reportPeriod: {
                startDate: '2025-01-01',
                endDate: '2025-01-15'
              }
            }
          })
        });
      }
    });

    // Mock progress API for main dashboard
    await page.route('**/api/v1/progress/summary', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            enrolledCourses: 5,
            averageProgress: 68.5,
            totalSpentMinutes: 1820,
            streakDays: 12
          }
        })
      });
    });

    await page.route('**/api/v1/progress/time-series*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { date: '2025-01-08', studyTime: 45, materialsCompleted: 2 },
            { date: '2025-01-09', studyTime: 60, materialsCompleted: 3 },
            { date: '2025-01-10', studyTime: 30, materialsCompleted: 1 },
            { date: '2025-01-11', studyTime: 75, materialsCompleted: 4 },
            { date: '2025-01-12', studyTime: 90, materialsCompleted: 5 },
            { date: '2025-01-13', studyTime: 50, materialsCompleted: 2 },
            { date: '2025-01-14', studyTime: 40, materialsCompleted: 1 },
            { date: '2025-01-15', studyTime: 85, materialsCompleted: 3 }
          ]
        })
      });
    });
  });

  test('displays learning history dashboard correctly', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();

    // Check that main progress page loads
    expect(await progressPage.isLoaded()).toBe(true);
    
    // Verify page title
    const title = await progressPage.pageTitle.textContent();
    expect(title).toBe('学習進捗');

    // Check if learning history section is visible
    await progressPage.scrollToLearningHistory();
    expect(await progressPage.isLearningHistoryVisible()).toBe(true);

    // Verify learning history title
    const historyTitle = await progressPage.learningHistoryTitle.textContent();
    expect(historyTitle).toBe('学習履歴');
  });

  test('displays progress summary statistics', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();

    const stats = await progressPage.getProgressStats();
    
    // Verify statistics are displayed
    expect(stats.enrolledCourses).toBe('5');
    expect(stats.averageProgress).toBe('68.5%');
    expect(stats.totalStudyTime).toBe('30h'); // 1820 minutes = 30+ hours
    expect(stats.currentStreak).toBe('12');
  });

  test('switches between learning history tabs successfully', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Test Overview tab (default)
    await progressPage.clickHistoryTab('概要');
    
    // Check if overview stats are visible
    const overviewStats = await progressPage.getOverviewStats();
    expect(overviewStats.totalAccesses).toBeTruthy();
    expect(overviewStats.totalStudyTime).toBeTruthy();

    // Test Access History tab
    await progressPage.clickHistoryTab('アクセス履歴');
    
    // Wait for history data to load
    await waitForAPIResponse(page, '**/learning-history/access-history');
    
    // Check table headers
    const headers = await progressPage.getHistoryTableHeaders();
    expect(headers).toContain('日時');
    expect(headers).toContain('教材');
    expect(headers).toContain('アクセス種別');
    expect(headers).toContain('継続時間');

    // Check that history rows are displayed
    const rowCount = await progressPage.getAccessHistoryRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Test Patterns tab
    await progressPage.clickHistoryTab('学習パターン');
    
    // Wait for patterns data to load
    await waitForAPIResponse(page, '**/learning-history/patterns');
    
    // Check that charts are visible
    expect(await progressPage.isChartVisible('hourly')).toBe(true);
    expect(await progressPage.isChartVisible('weekly')).toBe(true);
    expect(await progressPage.isChartVisible('material')).toBe(true);

    // Test Detailed Report tab
    await progressPage.clickHistoryTab('詳細レポート');
    
    // Wait for report data to load
    await waitForAPIResponse(page, '**/learning-history/report');
    
    // Check that report statistics are visible
    expect(await progressPage.isReportStatsVisible()).toBe(true);
  });

  test('generates and exports reports successfully', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Test date range setting
    await progressPage.setDateRange('2025-01-01', '2025-01-15');
    
    // Generate report
    await progressPage.generateReport();
    
    // Wait for report generation
    await waitForAPIResponse(page, '**/learning-history/report');
    
    // Switch to detailed report tab to see results
    await progressPage.clickHistoryTab('詳細レポート');
    expect(await progressPage.isReportStatsVisible()).toBe(true);
  });

  test('CSV export functionality works', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Mock CSV export API
    await page.route('**/api/v1/learning-history/export/csv*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="learning_history.csv"'
        },
        body: 'Date,Material,Access Type,Duration\n2025-01-15,JavaScript基礎,VIEW,45\n2025-01-15,React入門,DOWNLOAD,12\n'
      });
    });

    // Test main CSV export
    const download = await progressPage.exportCSV();
    expect(download.suggestedFilename()).toBe('learning_history.csv');
  });

  test('export specific report types', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Mock different export endpoints
    await page.route('**/api/v1/learning-history/export/overview*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="overview_summary.csv"'
        },
        body: 'Metric,Value\nTotal Accesses,142\nTotal Study Time,1820\n'
      });
    });

    await page.route('**/api/v1/learning-history/export/access-history*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="access_history.csv"'
        },
        body: 'Date,Material,Access Type,Duration\n2025-01-15,JavaScript基礎,VIEW,45\n'
      });
    });

    await page.route('**/api/v1/learning-history/export/material-breakdown*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="material_breakdown.csv"'
        },
        body: 'Material,Access Count,Total Time\nJavaScript基礎,45,300\n'
      });
    });

    await page.route('**/api/v1/learning-history/export/full-report*', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="full_statistics_report.csv"'
        },
        body: 'Report Period,2025-01-01 to 2025-01-15\nTotal Study Time,1820 minutes\n'
      });
    });

    // Test different export types
    const overviewDownload = await progressPage.exportSpecificReport('overview');
    expect(overviewDownload.suggestedFilename()).toBe('overview_summary.csv');

    const historyDownload = await progressPage.exportSpecificReport('history');
    expect(historyDownload.suggestedFilename()).toBe('access_history.csv');

    const breakdownDownload = await progressPage.exportSpecificReport('breakdown');
    expect(breakdownDownload.suggestedFilename()).toBe('material_breakdown.csv');

    const fullReportDownload = await progressPage.exportSpecificReport('full');
    expect(fullReportDownload.suggestedFilename()).toBe('full_statistics_report.csv');
  });

  test('handles loading states and errors gracefully', async ({ page }) => {
    // Test loading state
    await page.route('**/api/v1/learning-history/summary*', async route => {
      // Delay response to test loading state
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { totalAccesses: 0 } })
      });
    });

    await progressPage.goto();
    
    // Should show loading spinner initially
    expect(await progressPage.loadingSpinner.isVisible()).toBe(true);
    
    await progressPage.waitForPageLoad();
    
    // Test error state
    await page.route('**/api/v1/learning-history/summary*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Server error' })
      });
    });

    // Refresh to trigger error
    await page.reload();
    
    // Check for error message
    await page.waitForTimeout(1000);
    expect(await progressPage.errorMessage.isVisible()).toBe(true);
  });

  test('responsive design works on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Check that learning history section is still visible and functional on mobile
    expect(await progressPage.isLearningHistoryVisible()).toBe(true);
    
    // Test tab switching on mobile
    await progressPage.clickHistoryTab('アクセス履歴');
    const rowCount = await progressPage.getAccessHistoryRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('date range filtering works correctly', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Set specific date range
    const startDate = '2025-01-01';
    const endDate = '2025-01-15';
    
    await progressPage.setDateRange(startDate, endDate);
    
    // Generate report with date range
    await progressPage.generateReport();
    
    // Verify API was called with correct parameters
    const request = await page.waitForRequest(request => 
      request.url().includes('/learning-history/report') &&
      request.url().includes(`startDate=${startDate}`) &&
      request.url().includes(`endDate=${endDate}`)
    );
    
    expect(request.url()).toContain(`startDate=${startDate}`);
    expect(request.url()).toContain(`endDate=${endDate}`);
  });

  test('internationalization works correctly', async ({ page }) => {
    await progressPage.goto();
    await progressPage.waitForPageLoad();
    await progressPage.scrollToLearningHistory();

    // Check Japanese translations are displayed
    const historyTitle = await progressPage.learningHistoryTitle.textContent();
    expect(historyTitle).toBe('学習履歴');
    
    // Check tab names are in Japanese
    const overviewTabText = await progressPage.overviewTab.textContent();
    expect(overviewTabText).toBe('概要');
    
    const historyTabText = await progressPage.historyTab.textContent();
    expect(historyTabText).toBe('アクセス履歴');
    
    const patternsTabText = await progressPage.patternsTab.textContent();
    expect(patternsTabText).toBe('学習パターン');
    
    const reportTabText = await progressPage.reportTab.textContent();
    expect(reportTabText).toBe('詳細レポート');
  });
});