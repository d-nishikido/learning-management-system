import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly coursesSection: Locator;
  readonly progressSection: Locator;
  readonly profileMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebarNav: Locator;
  readonly mobileMenuButton: Locator;
  readonly navigationCards: Locator;
  readonly adminSection: Locator;
  readonly recentActivity: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.coursesSection = page.getByTestId('courses-section');
    this.progressSection = page.getByTestId('progress-section');
    this.profileMenu = page.getByTestId('profile-menu');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.sidebarNav = page.locator('.w-64.bg-white, [class*="w-64"]').first();
    this.mobileMenuButton = page.locator('svg.h-6.w-6').first();
    this.navigationCards = page.locator('[class*="card"], .rounded-lg.border.bg-white');
    this.adminSection = page.getByText('管理メニュー').locator('..');
    this.recentActivity = page.getByText('最近の活動').locator('..');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.welcomeMessage.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    await this.profileMenu.click();
    await this.logoutButton.click();
  }

  async navigateTo(menuItem: string) {
    await this.sidebarNav.getByRole('link', { name: menuItem }).click();
  }

  async navigateToSidebarItem(itemName: string) {
    // Click sidebar navigation item using page-level selector
    await this.page.getByRole('link', { name: itemName }).click();
  }

  async navigateFromDashboardCard(cardName: string) {
    // Click navigation card in dashboard
    const card = this.navigationCards.filter({ hasText: cardName });
    await card.getByRole('button', { name: /見る|確認|管理/ }).click();
  }

  async isSidebarVisible(): Promise<boolean> {
    try {
      // Look for sidebar by Japanese navigation text
      const dashboardLink = this.page.getByRole('link', { name: 'ダッシュボード' });
      await dashboardLink.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async openMobileMenu() {
    if (await this.mobileMenuButton.isVisible()) {
      await this.mobileMenuButton.click();
    }
  }

  async isAdminSectionVisible(): Promise<boolean> {
    try {
      await this.adminSection.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async getSidebarNavigationItems(): Promise<string[]> {
    // Get all links that are navigation items (not the logo)
    const allLinks = await this.page.getByRole('link').all();
    const texts = await Promise.all(allLinks.map(link => link.textContent()));
    
    // Filter to get only sidebar navigation items
    const navItems = texts.filter(text => 
      text && ['ダッシュボード', 'コース', '進捗管理', 'Q&A', 'プロフィール', 'ユーザー管理', '管理'].includes(text)
    );
    
    return navItems as string[];
  }
}