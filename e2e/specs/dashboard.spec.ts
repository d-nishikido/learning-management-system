import { test, expect } from '@fixtures/auth';
import { DashboardPage } from '@pages/DashboardPage';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page, authenticatedPage }) => {
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Dashboard Overview', () => {
    test('displays welcome message and user information', async ({ page }) => {
      await dashboardPage.goto();

      // Check welcome message is visible
      await expect(dashboardPage.welcomeMessage).toBeVisible();
      await expect(dashboardPage.welcomeMessage).toContainText('Welcome back');

      // Check user name is displayed
      const userNameElement = page.getByTestId('user-name');
      await expect(userNameElement).toBeVisible();
    });

    test('displays enrolled courses section', async ({ page }) => {
      await dashboardPage.goto();
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Check enrolled courses section
      const enrolledCoursesSection = page.getByTestId('enrolled-courses-section');
      await expect(enrolledCoursesSection).toBeVisible();

      // Check section header
      await expect(page.getByText('Enrolled Courses')).toBeVisible();
    });

    test('displays recent activity section', async ({ page }) => {
      await dashboardPage.goto();

      // Check recent activity section
      const recentActivitySection = page.getByTestId('recent-activity-section');
      await expect(recentActivitySection).toBeVisible();

      // Check section header
      await expect(page.getByText('Recent Activity')).toBeVisible();
    });

    test('displays learning statistics', async ({ page }) => {
      await dashboardPage.goto();
      await waitForAPIResponse(page, '/api/v1/progress/summary');

      // Check statistics cards
      const statsSection = page.getByTestId('learning-stats-section');
      await expect(statsSection).toBeVisible();

      // Check individual stat cards
      await expect(page.getByTestId('total-courses-stat')).toBeVisible();
      await expect(page.getByTestId('completed-lessons-stat')).toBeVisible();
      await expect(page.getByTestId('study-time-stat')).toBeVisible();
    });

    test('displays upcoming lessons section', async ({ page }) => {
      await dashboardPage.goto();

      // Check upcoming lessons section
      const upcomingSection = page.getByTestId('upcoming-lessons-section');
      await expect(upcomingSection).toBeVisible();

      // Check section header
      await expect(page.getByText('Upcoming Lessons')).toBeVisible();
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('navigates to courses from dashboard', async ({ page }) => {
      await dashboardPage.goto();

      // Click on "View All Courses" link
      const viewAllCoursesLink = page.getByRole('link', { name: 'View All Courses' });
      await viewAllCoursesLink.click();

      // Should navigate to courses page
      await page.waitForURL('/courses');
      expect(page.url()).toContain('/courses');
    });

    test('navigates to progress from dashboard', async ({ page }) => {
      await dashboardPage.goto();

      // Click on "View Progress" link
      const viewProgressLink = page.getByRole('link', { name: 'View Progress' });
      await viewProgressLink.click();

      // Should navigate to progress page
      await page.waitForURL('/progress');
      expect(page.url()).toContain('/progress');
    });

    test('navigates to course detail from enrolled course', async ({ page }) => {
      await dashboardPage.goto();
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Find and click on first enrolled course
      const firstCourseCard = page.getByTestId('enrolled-course-card').first();
      await expect(firstCourseCard).toBeVisible();
      
      const courseLink = firstCourseCard.getByRole('link').first();
      await courseLink.click();

      // Should navigate to course detail page
      await page.waitForURL(/\/courses\/\d+/);
      expect(page.url()).toMatch(/\/courses\/\d+/);
    });
  });

  test.describe('Dashboard Quick Actions', () => {
    test('quick start lesson from dashboard', async ({ page }) => {
      await dashboardPage.goto();
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Look for "Continue Learning" or "Start Lesson" button
      const continueButton = page.getByRole('button', { name: /Continue Learning|Start Lesson/i });
      
      if (await continueButton.isVisible()) {
        await continueButton.click();
        
        // Should navigate to a lesson page
        await page.waitForURL(/\/courses\/\d+\/lessons\/\d+/);
        expect(page.url()).toMatch(/\/courses\/\d+\/lessons\/\d+/);
      }
    });

    test('search from dashboard', async ({ page }) => {
      await dashboardPage.goto();

      // Use search input in header/nav
      const searchInput = page.getByPlaceholder('Search courses, lessons...');
      if (await searchInput.isVisible()) {
        await searchInput.fill('TypeScript');
        await searchInput.press('Enter');

        // Should navigate to search results
        await page.waitForURL(/\/search/);
        expect(page.url()).toContain('/search');
      }
    });
  });

  test.describe('Dashboard Responsive Design', () => {
    test('displays correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await dashboardPage.goto();

      // Check that main sections are still visible
      await expect(dashboardPage.welcomeMessage).toBeVisible();
      
      // Check that cards stack properly on mobile
      const statsSection = page.getByTestId('learning-stats-section');
      await expect(statsSection).toBeVisible();
    });

    test('displays correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await dashboardPage.goto();

      // Check that layout adapts to tablet
      await expect(dashboardPage.welcomeMessage).toBeVisible();
      
      const enrolledCoursesSection = page.getByTestId('enrolled-courses-section');
      await expect(enrolledCoursesSection).toBeVisible();
    });
  });

  test.describe('Dashboard Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/v1/users/me/enrolled-courses', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });

      await dashboardPage.goto();

      // Check that error message is displayed
      const errorMessage = page.getByTestId('courses-error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Unable to load courses');
    });

    test('displays loading states', async ({ page }) => {
      // Mock delayed API response
      await page.route('**/api/v1/progress/summary', async route => {
        await page.waitForTimeout(2000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              enrolledCourses: 3,
              completedLessons: 12,
              totalStudyTime: 450
            }
          })
        });
      });

      await dashboardPage.goto();

      // Check that loading spinner is visible initially
      const loadingSpinner = page.getByTestId('stats-loading');
      await expect(loadingSpinner).toBeVisible();

      // Wait for loading to complete
      await waitForAPIResponse(page, '/api/v1/progress/summary');
      await expect(loadingSpinner).not.toBeVisible();
    });
  });

  test.describe('Dashboard Data Updates', () => {
    test('refreshes data when returning to dashboard', async ({ page }) => {
      await dashboardPage.goto();
      
      // Navigate away and back
      await page.goto('/courses');
      await page.goBack();

      // Data should refresh
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');
      
      const enrolledCoursesSection = page.getByTestId('enrolled-courses-section');
      await expect(enrolledCoursesSection).toBeVisible();
    });

    test('updates progress data in real-time', async ({ page }) => {
      await dashboardPage.goto();
      await waitForAPIResponse(page, '/api/v1/progress/summary');

      // Mock updated progress data
      await page.route('**/api/v1/progress/summary', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              enrolledCourses: 4,
              completedLessons: 15,
              totalStudyTime: 500
            }
          })
        });
      });

      // Trigger refresh
      await page.reload();
      await waitForAPIResponse(page, '/api/v1/progress/summary');

      // Check updated values
      const completedLessonsElement = page.getByTestId('completed-lessons-stat');
      await expect(completedLessonsElement).toContainText('15');
    });
  });
});