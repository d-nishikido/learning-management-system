import { test, expect } from '@fixtures/auth';
import { testUsers } from '@fixtures/users';

test.describe('Sidebar Navigation', () => {
  test.describe('Desktop Sidebar Navigation', () => {
    test.use({ 
      viewport: { width: 1280, height: 720 },
      storageState: undefined 
    });

    test('sidebar is visible on desktop', async ({ page }) => {
      // Set up authentication
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'USER',
          email: 'user@test.example.com',
          name: 'Test User'
        }));
      });

      await page.goto('/dashboard');
      
      // Verify page loaded
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
      
      // Sidebar should be visible on desktop - check for navigation links
      await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'コース' })).toBeVisible();
      await expect(page.getByRole('link', { name: '進捗管理' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Q&A' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'プロフィール' })).toBeVisible();
    });

    test('navigate through sidebar items', async ({ page }) => {
      // Set up authentication
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'USER',
          email: 'user@test.example.com',
          name: 'Test User'
        }));
      });

      await page.goto('/dashboard');
      
      // Test navigation to each sidebar item
      const navigationTests = [
        { name: 'コース', expectedUrl: '/courses' },
        { name: '進捗管理', expectedUrl: '/progress' },
        { name: 'Q&A', expectedUrl: '/qa' },
        { name: 'プロフィール', expectedUrl: '/profile' }
      ];

      for (const navTest of navigationTests) {
        await page.getByRole('link', { name: navTest.name }).click();
        await page.waitForURL(navTest.expectedUrl);
        expect(page.url()).toContain(navTest.expectedUrl);
        
        // Go back to dashboard for next test
        await page.getByRole('link', { name: 'ダッシュボード' }).click();
        await page.waitForURL('/dashboard');
      }
    });

    test('sidebar navigation preserves state', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Navigate to courses page
      await dashboardPage.navigateToSidebarItem('コース');
      await page.waitForURL('/courses');
      
      // Sidebar should still be visible
      const sidebarVisible = await dashboardPage.isSidebarVisible();
      expect(sidebarVisible).toBe(true);
      
      // Current page should be highlighted in sidebar (if implemented)
      const activeLink = page.locator('[aria-current="page"], .active, [class*="active"]');
      await expect(activeLink).toBeVisible();
    });
  });

  test.describe('Dashboard Card Navigation', () => {
    test.use({ storageState: undefined });

    test('navigate from dashboard cards to main sections', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Verify dashboard title
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
      
      // Test navigation cards
      const cardTests = [
        { cardName: 'コース', buttonText: 'コースを見る', expectedUrl: '/courses' },
        { cardName: '進捗管理', buttonText: '進捗を確認', expectedUrl: '/progress' },
        { cardName: 'Q&A', buttonText: 'Q&Aを見る', expectedUrl: '/qa' }
      ];

      for (const cardTest of cardTests) {
        // Go back to dashboard
        await dashboardPage.goto();
        
        // Find and click the card button
        const card = page.locator('.card, [class*="card"]').filter({ hasText: cardTest.cardName });
        await expect(card).toBeVisible();
        
        const button = card.getByRole('button', { name: cardTest.buttonText });
        await expect(button).toBeVisible();
        await button.click();
        
        // Verify navigation
        await page.waitForURL(cardTest.expectedUrl);
        expect(page.url()).toContain(cardTest.expectedUrl);
      }
    });

    test('dashboard displays learning statistics', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Verify statistics section exists
      const statsSection = page.locator('.grid').filter({ hasText: /受講中のコース|平均進捗率|獲得バッジ/ });
      await expect(statsSection).toBeVisible();
      
      // Verify specific stats are displayed
      await expect(page.getByText('受講中のコース')).toBeVisible();
      await expect(page.getByText('平均進捗率')).toBeVisible();
      await expect(page.getByText('獲得バッジ')).toBeVisible();
    });

    test('dashboard displays recent activity', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Verify recent activity section
      await expect(page.getByText('最近の活動')).toBeVisible();
      
      // Verify activity items are displayed (even if mock data)
      const activitySection = page.getByText('最近の活動').locator('..');
      await expect(activitySection).toBeVisible();
    });
  });

  test.describe('Admin Navigation', () => {
    test.use({ storageState: undefined });

    test('admin user sees management section', async ({ page, dashboardPage }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com',
          name: 'Admin User'
        }));
      });

      await dashboardPage.goto();
      
      // Admin section should be visible
      const adminSectionVisible = await dashboardPage.isAdminSectionVisible();
      expect(adminSectionVisible).toBe(true);
      
      // Verify admin navigation items in sidebar
      const navigationItems = await dashboardPage.getSidebarNavigationItems();
      expect(navigationItems).toContain('ユーザー管理');
      expect(navigationItems).toContain('管理');
    });

    test('admin can navigate to management pages', async ({ page, dashboardPage }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com',
          name: 'Admin User'
        }));
      });

      await dashboardPage.goto();
      
      // Test admin navigation from sidebar
      await dashboardPage.navigateToSidebarItem('ユーザー管理');
      await page.waitForURL('/users');
      expect(page.url()).toContain('/users');
      
      // Go back to dashboard and test admin panel navigation
      await dashboardPage.goto();
      await dashboardPage.navigateToSidebarItem('管理');
      await page.waitForURL('/admin');
      expect(page.url()).toContain('/admin');
    });

    test('admin can navigate from dashboard admin cards', async ({ page, dashboardPage }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com',
          name: 'Admin User'
        }));
      });

      await dashboardPage.goto();
      
      // Test admin dashboard cards
      const adminCardTests = [
        { cardName: 'ユーザー管理', buttonText: 'ユーザー管理', expectedUrl: '/users' },
        { cardName: 'システム管理', buttonText: '管理画面', expectedUrl: '/admin' }
      ];

      for (const cardTest of adminCardTests) {
        // Go back to dashboard
        await dashboardPage.goto();
        
        // Find and click the admin card button
        const adminSection = page.getByText('管理メニュー').locator('..');
        const card = adminSection.locator('.card, [class*="card"]').filter({ hasText: cardTest.cardName });
        await expect(card).toBeVisible();
        
        const button = card.getByRole('button', { name: cardTest.buttonText });
        await expect(button).toBeVisible();
        await button.click();
        
        // Verify navigation
        await page.waitForURL(cardTest.expectedUrl);
        expect(page.url()).toContain(cardTest.expectedUrl);
      }
    });

    test('regular user does not see admin section', async ({ page, dashboardPage }) => {
      // Mock regular user
      await page.addInitScript(() => {
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({
          id: 2,
          role: 'USER',
          email: 'user@test.example.com',
          name: 'Regular User'
        }));
      });

      await dashboardPage.goto();
      
      // Admin section should NOT be visible
      const adminSectionVisible = await dashboardPage.isAdminSectionVisible();
      expect(adminSectionVisible).toBe(false);
      
      // Verify admin navigation items are NOT in sidebar
      const navigationItems = await dashboardPage.getSidebarNavigationItems();
      expect(navigationItems).not.toContain('ユーザー管理');
      expect(navigationItems).not.toContain('管理');
    });
  });

  test.describe('Mobile Sidebar Navigation', () => {
    test.use({ 
      viewport: { width: 375, height: 667 },
      storageState: undefined 
    });

    test('mobile sidebar is hidden by default', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Sidebar should be hidden on mobile
      const sidebarVisible = await dashboardPage.isSidebarVisible();
      expect(sidebarVisible).toBe(false);
      
      // Mobile menu button should be visible
      await expect(dashboardPage.mobileMenuButton).toBeVisible();
    });

    test('mobile sidebar can be opened and closed', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Open mobile menu
      await dashboardPage.openMobileMenu();
      
      // Sidebar should now be visible
      const sidebarVisible = await dashboardPage.isSidebarVisible();
      expect(sidebarVisible).toBe(true);
      
      // Test navigation
      await dashboardPage.navigateToSidebarItem('コース');
      await page.waitForURL('/courses');
      
      // After navigation, sidebar should be closed again
      await page.waitForTimeout(500); // Allow for animation
      const sidebarStillVisible = await dashboardPage.isSidebarVisible();
      expect(sidebarStillVisible).toBe(false);
    });

    test('mobile navigation preserves functionality', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();
      
      // Open mobile menu
      await dashboardPage.openMobileMenu();
      
      // Verify all navigation items are present
      const navigationItems = await dashboardPage.getSidebarNavigationItems();
      expect(navigationItems).toContain('ダッシュボード');
      expect(navigationItems).toContain('コース');
      expect(navigationItems).toContain('進捗管理');
      expect(navigationItems).toContain('Q&A');
      expect(navigationItems).toContain('プロフィール');
    });
  });
});