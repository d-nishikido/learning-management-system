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

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.coursesSection = page.getByTestId('courses-section');
    this.progressSection = page.getByTestId('progress-section');
    this.profileMenu = page.getByTestId('profile-menu');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.sidebarNav = page.getByRole('navigation', { name: 'sidebar' });
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
}