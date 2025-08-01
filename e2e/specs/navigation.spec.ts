import { test, expect } from '@fixtures/auth';
import { testUsers } from '@fixtures/users';

test.describe('Navigation', () => {
  test.describe('Authenticated Navigation', () => {
    test.use({ storageState: undefined });

    test('navigate through main menu items', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();

      // Test navigation to different sections
      const menuItems = [
        { name: 'Courses', url: '/courses' },
        { name: 'My Progress', url: '/progress' },
        { name: 'Q&A', url: '/qa' },
        { name: 'Rankings', url: '/rankings' }
      ];

      for (const item of menuItems) {
        await dashboardPage.navigateTo(item.name);
        await page.waitForURL(item.url);
        expect(page.url()).toContain(item.url);
        
        // Verify page loaded
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
    });

    test('role-based menu visibility - Admin', async ({ page, dashboardPage }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com'
        }));
      });

      await dashboardPage.goto();

      // Admin-only menu items should be visible
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'User Management' })).toBeVisible();
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'Course Management' })).toBeVisible();
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'Analytics' })).toBeVisible();
    });

    test('role-based menu visibility - Regular User', async ({ page, dashboardPage }) => {
      // Mock regular user
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 2,
          role: 'USER',
          email: 'user@test.example.com'
        }));
      });

      await dashboardPage.goto();

      // Admin-only menu items should NOT be visible
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'User Management' })).not.toBeVisible();
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'Course Management' })).not.toBeVisible();
      await expect(dashboardPage.sidebarNav.getByRole('link', { name: 'Analytics' })).not.toBeVisible();
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ 
      viewport: { width: 375, height: 667 },
      storageState: undefined
    });

    test('mobile menu toggle', async ({ page, dashboardPage, authenticatedPage }) => {
      await dashboardPage.goto();

      // Mobile menu should be hidden initially
      const mobileMenu = page.getByTestId('mobile-menu');
      await expect(mobileMenu).not.toBeVisible();

      // Click hamburger menu
      const hamburgerButton = page.getByRole('button', { name: 'Menu' });
      await hamburgerButton.click();

      // Mobile menu should be visible
      await expect(mobileMenu).toBeVisible();

      // Navigate to a page
      await mobileMenu.getByRole('link', { name: 'Courses' }).click();
      await page.waitForURL('/courses');

      // Mobile menu should close after navigation
      await expect(mobileMenu).not.toBeVisible();
    });

    test('responsive layout adjustments', async ({ page, authenticatedPage }) => {
      await page.goto('/dashboard');

      // Check that sidebar is hidden on mobile
      const sidebar = page.getByRole('navigation', { name: 'sidebar' });
      await expect(sidebar).not.toBeVisible();

      // Check that mobile header is visible
      const mobileHeader = page.getByTestId('mobile-header');
      await expect(mobileHeader).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('breadcrumb navigation in course details', async ({ page, authenticatedPage }) => {
      // Navigate to a specific course
      await page.goto('/courses/1');

      const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' });
      
      // Check breadcrumb structure
      await expect(breadcrumb.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(breadcrumb.getByRole('link', { name: 'Courses' })).toBeVisible();
      await expect(breadcrumb.getByText('Introduction to TypeScript')).toBeVisible();

      // Navigate back using breadcrumb
      await breadcrumb.getByRole('link', { name: 'Courses' }).click();
      await page.waitForURL('/courses');
      expect(page.url()).toContain('/courses');
    });
  });

  test.describe('404 and Error Pages', () => {
    test('404 page for non-existent routes', async ({ page }) => {
      await page.goto('/non-existent-page');

      // Should show 404 page
      await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
      await expect(page.getByText('Page not found')).toBeVisible();
      
      // Should have link to go back home
      const homeLink = page.getByRole('link', { name: 'Go to Home' });
      await expect(homeLink).toBeVisible();
      
      await homeLink.click();
      await page.waitForURL('/');
    });
  });
});