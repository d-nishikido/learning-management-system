import { Page, Locator } from '@playwright/test';

export class ProgressPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  // Progress Summary Stats
  readonly enrolledCoursesCard: Locator;
  readonly averageProgressCard: Locator;
  readonly totalStudyTimeCard: Locator;
  readonly currentStreakCard: Locator;

  // Charts Section
  readonly progressChartsSection: Locator;
  readonly overallProgressChart: Locator;
  readonly studyTimeProgressChart: Locator;
  readonly courseProgressChart: Locator;

  // Learning Calendar
  readonly learningCalendarSection: Locator;
  readonly learningCalendar: Locator;

  // Learning History Dashboard (newly implemented)
  readonly learningHistorySection: Locator;
  readonly learningHistoryTitle: Locator;
  readonly dateRangeInputs: Locator;
  readonly generateReportButton: Locator;
  readonly exportCSVButton: Locator;
  readonly historyTabs: Locator;
  readonly overviewTab: Locator;
  readonly historyTab: Locator;
  readonly patternsTab: Locator;
  readonly reportTab: Locator;

  // Overview Tab Elements
  readonly totalAccessesCard: Locator;
  readonly totalStudyTimeOverviewCard: Locator;
  readonly averageSessionCard: Locator;
  readonly mostActiveCard: Locator;

  // History Tab Elements
  readonly accessHistoryTable: Locator;
  readonly historyTableHeaders: Locator;
  readonly historyTableRows: Locator;

  // Patterns Tab Elements
  readonly hourlyPatternChart: Locator;
  readonly weeklyPatternChart: Locator;
  readonly materialBreakdownChart: Locator;

  // Report Tab Elements
  readonly detailedReportSection: Locator;
  readonly reportStats: Locator;

  // Export Buttons
  readonly exportOverviewButton: Locator;
  readonly exportAccessHistoryButton: Locator;
  readonly exportMaterialBreakdownButton: Locator;
  readonly exportFullReportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.pageSubtitle = page.locator('p').filter({ hasText: 'あなたの学習状況を詳しく確認しましょう' });
    this.loadingSpinner = page.getByTestId('loading-spinner');
    this.errorMessage = page.locator('.text-red-600');

    // Progress Summary Stats
    this.enrolledCoursesCard = page.locator('.grid > div').first();
    this.averageProgressCard = page.locator('.grid > div').nth(1);
    this.totalStudyTimeCard = page.locator('.grid > div').nth(2);
    this.currentStreakCard = page.locator('.grid > div').nth(3);

    // Charts Section
    this.progressChartsSection = page.getByText('進捗グラフ').locator('..');
    this.overallProgressChart = page.locator('[data-testid="overall-progress-chart"]');
    this.studyTimeProgressChart = page.locator('[data-testid="time-series-chart"]');
    this.courseProgressChart = page.locator('[data-testid="course-progress-chart"]');

    // Learning Calendar
    this.learningCalendarSection = page.getByText('学習カレンダー').locator('..');
    this.learningCalendar = page.locator('[data-testid="learning-calendar"]');

    // Learning History Dashboard
    this.learningHistorySection = page.getByText('学習履歴').locator('..');
    this.learningHistoryTitle = page.getByText('学習履歴');
    this.dateRangeInputs = page.locator('input[type="date"]');
    this.generateReportButton = page.getByRole('button', { name: 'レポート生成' });
    this.exportCSVButton = page.getByRole('button', { name: 'CSV出力' });
    this.historyTabs = page.locator('[role="tablist"]');
    this.overviewTab = page.getByRole('tab', { name: '概要' });
    this.historyTab = page.getByRole('tab', { name: 'アクセス履歴' });
    this.patternsTab = page.getByRole('tab', { name: '学習パターン' });
    this.reportTab = page.getByRole('tab', { name: '詳細レポート' });

    // Overview Tab Elements
    this.totalAccessesCard = page.getByText('総アクセス数').locator('..');
    this.totalStudyTimeOverviewCard = page.getByText('総学習時間').locator('..');
    this.averageSessionCard = page.getByText('平均セッション時間').locator('..');
    this.mostActiveCard = page.getByText('最も活発な時間').locator('..');

    // History Tab Elements
    this.accessHistoryTable = page.locator('table');
    this.historyTableHeaders = page.locator('thead th');
    this.historyTableRows = page.locator('tbody tr');

    // Patterns Tab Elements
    this.hourlyPatternChart = page.locator('[data-testid="hourly-pattern-chart"]');
    this.weeklyPatternChart = page.locator('[data-testid="weekly-pattern-chart"]');
    this.materialBreakdownChart = page.locator('[data-testid="material-breakdown-chart"]');

    // Report Tab Elements
    this.detailedReportSection = page.getByText('詳細統計レポート').locator('..');
    this.reportStats = page.locator('[data-testid="report-stats"]');

    // Export Buttons
    this.exportOverviewButton = page.getByRole('button', { name: '概要サマリーを出力' });
    this.exportAccessHistoryButton = page.getByRole('button', { name: 'アクセス履歴を出力' });
    this.exportMaterialBreakdownButton = page.getByRole('button', { name: '教材別内訳を出力' });
    this.exportFullReportButton = page.getByRole('button', { name: '完全統計レポートを出力' });
  }

  async goto() {
    await this.page.goto('/progress');
  }

  async waitForPageLoad() {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.pageTitle.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getProgressStats(): Promise<{
    enrolledCourses: string;
    averageProgress: string;
    totalStudyTime: string;
    currentStreak: string;
  }> {
    return {
      enrolledCourses: await this.enrolledCoursesCard.locator('.text-2xl').textContent() ?? '',
      averageProgress: await this.averageProgressCard.locator('.text-2xl').textContent() ?? '',
      totalStudyTime: await this.totalStudyTimeCard.locator('.text-2xl').textContent() ?? '',
      currentStreak: await this.currentStreakCard.locator('.text-2xl').textContent() ?? '',
    };
  }

  async isLearningHistoryVisible(): Promise<boolean> {
    try {
      await this.learningHistorySection.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickHistoryTab(tabName: '概要' | 'アクセス履歴' | '学習パターン' | '詳細レポート') {
    const tab = this.page.getByRole('tab', { name: tabName });
    await tab.click();
    await this.page.waitForTimeout(500); // Wait for tab content to load
  }

  async setDateRange(startDate: string, endDate: string) {
    const dateInputs = await this.dateRangeInputs.all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill(startDate);
      await dateInputs[1].fill(endDate);
    }
  }

  async generateReport() {
    await this.generateReportButton.click();
    await this.page.waitForTimeout(1000); // Wait for report generation
  }

  async exportCSV() {
    // Setup download handler
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportCSVButton.click();
    const download = await downloadPromise;
    return download;
  }

  async getOverviewStats(): Promise<{
    totalAccesses: string;
    totalStudyTime: string;
    averageSession: string;
    mostActive: string;
  }> {
    return {
      totalAccesses: await this.totalAccessesCard.locator('.text-2xl, .font-bold').first().textContent() ?? '',
      totalStudyTime: await this.totalStudyTimeOverviewCard.locator('.text-2xl, .font-bold').first().textContent() ?? '',
      averageSession: await this.averageSessionCard.locator('.text-2xl, .font-bold').first().textContent() ?? '',
      mostActive: await this.mostActiveCard.locator('.text-2xl, .font-bold').first().textContent() ?? '',
    };
  }

  async getAccessHistoryRowCount(): Promise<number> {
    const rows = await this.historyTableRows.all();
    return rows.length;
  }

  async getHistoryTableHeaders(): Promise<string[]> {
    const headers = await this.historyTableHeaders.all();
    const texts = await Promise.all(headers.map(header => header.textContent()));
    return texts.filter(text => text !== null) as string[];
  }

  async isChartVisible(chartType: 'hourly' | 'weekly' | 'material'): Promise<boolean> {
    let chart: Locator;
    switch (chartType) {
      case 'hourly':
        chart = this.hourlyPatternChart;
        break;
      case 'weekly':
        chart = this.weeklyPatternChart;
        break;
      case 'material':
        chart = this.materialBreakdownChart;
        break;
    }

    try {
      await chart.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async isReportStatsVisible(): Promise<boolean> {
    try {
      await this.reportStats.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async exportSpecificReport(reportType: 'overview' | 'history' | 'breakdown' | 'full') {
    const downloadPromise = this.page.waitForEvent('download');
    
    let button: Locator;
    switch (reportType) {
      case 'overview':
        button = this.exportOverviewButton;
        break;
      case 'history':
        button = this.exportAccessHistoryButton;
        break;
      case 'breakdown':
        button = this.exportMaterialBreakdownButton;
        break;
      case 'full':
        button = this.exportFullReportButton;
        break;
    }
    
    await button.click();
    const download = await downloadPromise;
    return download;
  }

  async scrollToLearningHistory() {
    await this.learningHistorySection.scrollIntoViewIfNeeded();
  }
}