import { test, expect } from '@fixtures/auth';
import { testUsers } from '@fixtures/users';
import { setupTestUser, waitForAPIResponse } from '@utils/test-helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('successful login with valid credentials', async ({ page, loginPage, dashboardPage }) => {
    await setupTestUser(page, 'user1');
    await loginPage.goto();

    // Fill in login form
    await loginPage.login(testUsers.user1.email, testUsers.user1.password);

    // Wait for navigation to dashboard
    await waitForAPIResponse(page, '/api/v1/auth/login');
    await page.waitForURL('/dashboard');

    // Verify user is logged in
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    expect(await dashboardPage.welcomeMessage.textContent()).toContain(testUsers.user1.fullName);
  });

  test('login fails with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();

    // Try to login with wrong password
    await loginPage.login(testUsers.user1.email, 'wrongpassword');

    // Verify error message is displayed
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid email or password');

    // Verify we're still on login page
    expect(page.url()).toContain('/login');
  });

  test('login form validation', async ({ loginPage }) => {
    await loginPage.goto();

    // Check that login button is disabled initially
    expect(await loginPage.isLoginButtonDisabled()).toBe(true);

    // Fill only email
    await loginPage.emailInput.fill('test@example.com');
    expect(await loginPage.isLoginButtonDisabled()).toBe(true);

    // Fill both fields
    await loginPage.passwordInput.fill('password');
    expect(await loginPage.isLoginButtonDisabled()).toBe(false);
  });

  test('logout functionality', async ({ page, loginPage, dashboardPage, authenticatedPage }) => {
    // Start authenticated
    await dashboardPage.goto();
    
    // Verify user is logged in
    expect(await dashboardPage.isLoggedIn()).toBe(true);

    // Logout
    await dashboardPage.logout();

    // Verify redirect to login page
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');

    // Try to access dashboard again
    await dashboardPage.goto();
    
    // Should redirect to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });

  test('token refresh flow', async ({ page, authenticatedPage }) => {
    // Mock expired token scenario
    await page.route('**/api/v1/courses', async route => {
      if (route.request().headers()['authorization']) {
        // First request returns 401
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ message: 'Token expired' })
        });
      }
    });

    // Mock refresh token endpoint
    await page.route('**/api/v1/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token'
        })
      });
    });

    // Navigate to a page that requires auth
    await page.goto('/courses');

    // Should attempt refresh and stay on page
    await waitForAPIResponse(page, '/api/v1/auth/refresh');
    expect(page.url()).toContain('/courses');
  });

  test('password reset flow', async ({ page, loginPage }) => {
    await loginPage.goto();

    // Click forgot password
    await loginPage.forgotPasswordLink.click();

    // Should navigate to password reset page
    await page.waitForURL('/forgot-password');
    expect(page.url()).toContain('/forgot-password');

    // Fill in email
    await page.getByLabel('Email').fill(testUsers.user1.email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    // Verify success message
    const successMessage = await page.getByTestId('success-message').textContent();
    expect(successMessage).toContain('Password reset link sent');
  });
});