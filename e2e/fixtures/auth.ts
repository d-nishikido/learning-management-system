import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';

type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  authenticatedPage: [async ({ page, context }, use) => {
    // Set up authentication state
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    // Store auth token in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
    });

    await use();
  }, { scope: 'test' }],
});

export { expect } from '@playwright/test';