import { test, expect } from '@fixtures/auth';
import { testUsers } from '@fixtures/users';
import { waitForAPIResponse, generateRandomEmail } from '@utils/test-helpers';

test.describe('User Management', () => {
  test.describe('User Profile', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
      // Start authenticated
    });

    test('view own profile', async ({ page }) => {
      await page.goto('/profile');

      // Verify profile information is displayed
      await expect(page.getByTestId('profile-email')).toContainText('user1@test.example.com');
      await expect(page.getByTestId('profile-username')).toContainText('user1');
      await expect(page.getByTestId('profile-fullname')).toContainText('Test User 1');
      await expect(page.getByTestId('profile-role')).toContainText('User');
    });

    test('update profile information', async ({ page }) => {
      await page.goto('/profile');

      // Click edit button
      await page.getByRole('button', { name: 'Edit Profile' }).click();

      // Update profile fields
      await page.getByLabel('Full Name').clear();
      await page.getByLabel('Full Name').fill('Updated User Name');
      
      await page.getByLabel('Bio').fill('This is my bio');
      
      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await waitForAPIResponse(page, '/api/v1/users/me');

      // Verify success message
      await expect(page.getByTestId('success-message')).toContainText('Profile updated successfully');

      // Verify updated information
      await expect(page.getByTestId('profile-fullname')).toContainText('Updated User Name');
      await expect(page.getByTestId('profile-bio')).toContainText('This is my bio');
    });

    test('change password', async ({ page }) => {
      await page.goto('/profile');

      // Navigate to security settings
      await page.getByRole('tab', { name: 'Security' }).click();

      // Fill password change form
      await page.getByLabel('Current Password').fill('User123!');
      await page.getByLabel('New Password').fill('NewUser123!');
      await page.getByLabel('Confirm Password').fill('NewUser123!');

      // Submit form
      await page.getByRole('button', { name: 'Change Password' }).click();
      await waitForAPIResponse(page, '/api/v1/users/me/password');

      // Verify success message
      await expect(page.getByTestId('success-message')).toContainText('Password changed successfully');
    });

    test('view learning statistics', async ({ page }) => {
      await page.goto('/profile');

      // Navigate to stats tab
      await page.getByRole('tab', { name: 'Statistics' }).click();

      // Verify statistics are displayed
      await expect(page.getByTestId('total-courses')).toBeVisible();
      await expect(page.getByTestId('completed-courses')).toBeVisible();
      await expect(page.getByTestId('total-study-time')).toBeVisible();
      await expect(page.getByTestId('average-progress')).toBeVisible();
    });

    test('view badges and achievements', async ({ page }) => {
      await page.goto('/profile');

      // Navigate to achievements tab
      await page.getByRole('tab', { name: 'Achievements' }).click();

      // Verify badges section
      const badgesSection = page.getByTestId('badges-section');
      await expect(badgesSection).toBeVisible();

      // Check for badge elements
      const badges = badgesSection.locator('.badge-item');
      const badgeCount = await badges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Admin User Management', () => {
    test.beforeEach(async ({ page, authenticatedPage }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com'
        }));
      });
    });

    test('view user list', async ({ page }) => {
      await page.goto('/admin/users');

      // Wait for users to load
      await waitForAPIResponse(page, '/api/v1/users');

      // Verify user table is displayed
      const userTable = page.getByTestId('users-table');
      await expect(userTable).toBeVisible();

      // Check table headers
      await expect(userTable.locator('th')).toContainText(['Email', 'Username', 'Role', 'Status', 'Actions']);

      // Verify users are listed
      const userRows = userTable.locator('tbody tr');
      await expect(userRows).toHaveCount(3); // 3 users from seed data
    });

    test('search and filter users', async ({ page }) => {
      await page.goto('/admin/users');

      // Search by email
      await page.getByPlaceholder('Search users...').fill('user1@test');
      await page.getByPlaceholder('Search users...').press('Enter');
      await waitForAPIResponse(page, '/api/v1/users');

      // Should show only matching user
      const userRows = page.getByTestId('users-table').locator('tbody tr');
      await expect(userRows).toHaveCount(1);
      await expect(userRows.first()).toContainText('user1@test.example.com');

      // Clear search
      await page.getByPlaceholder('Search users...').clear();

      // Filter by role
      await page.getByLabel('Role Filter').selectOption('USER');
      await waitForAPIResponse(page, '/api/v1/users');

      // Should show only regular users
      await expect(userRows).toHaveCount(2);
    });

    test('create new user', async ({ page }) => {
      await page.goto('/admin/users');

      // Click create user button
      await page.getByRole('button', { name: 'Create User' }).click();

      // Fill user creation form
      const newEmail = generateRandomEmail();
      await page.getByLabel('Email').fill(newEmail);
      await page.getByLabel('Username').fill('newuser');
      await page.getByLabel('Full Name').fill('New Test User');
      await page.getByLabel('Password').fill('NewUser123!');
      await page.getByLabel('Role').selectOption('USER');

      // Submit form
      await page.getByRole('button', { name: 'Create' }).click();
      await waitForAPIResponse(page, '/api/v1/users', 201);

      // Verify success message
      await expect(page.getByTestId('success-message')).toContainText('User created successfully');

      // New user should appear in the list
      await expect(page.getByText(newEmail)).toBeVisible();
    });

    test('edit user details', async ({ page }) => {
      await page.goto('/admin/users');

      // Find user2 and click edit
      const userRow = page.getByTestId('users-table').locator('tr', { hasText: 'user2@test.example.com' });
      await userRow.getByRole('button', { name: 'Edit' }).click();

      // Should navigate to edit page
      await page.waitForURL(/\/admin\/users\/\d+\/edit/);

      // Update user details
      await page.getByLabel('Full Name').clear();
      await page.getByLabel('Full Name').fill('Updated User 2');
      await page.getByLabel('Role').selectOption('ADMIN');

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await waitForAPIResponse(page, '/api/v1/users');

      // Should redirect back to users list
      await page.waitForURL('/admin/users');

      // Verify updated information
      const updatedRow = page.getByTestId('users-table').locator('tr', { hasText: 'user2@test.example.com' });
      await expect(updatedRow).toContainText('Updated User 2');
      await expect(updatedRow).toContainText('Admin');
    });

    test('deactivate user', async ({ page }) => {
      await page.goto('/admin/users');

      // Find user2 and click deactivate
      const userRow = page.getByTestId('users-table').locator('tr', { hasText: 'user2@test.example.com' });
      await userRow.getByRole('button', { name: 'Deactivate' }).click();

      // Confirm deactivation
      await page.getByRole('button', { name: 'Confirm' }).click();
      await waitForAPIResponse(page, '/api/v1/users');

      // User status should change
      await expect(userRow).toContainText('Inactive');
      
      // Button should change to "Activate"
      await expect(userRow.getByRole('button', { name: 'Activate' })).toBeVisible();
    });

    test('view user details and activity', async ({ page }) => {
      await page.goto('/admin/users');

      // Click on a user to view details
      const userRow = page.getByTestId('users-table').locator('tr', { hasText: 'user1@test.example.com' });
      await userRow.getByRole('link', { name: 'user1@test.example.com' }).click();

      // Should navigate to user details page
      await page.waitForURL(/\/admin\/users\/\d+/);

      // Verify user information sections
      await expect(page.getByTestId('user-info-section')).toBeVisible();
      await expect(page.getByTestId('user-courses-section')).toBeVisible();
      await expect(page.getByTestId('user-activity-section')).toBeVisible();
      await expect(page.getByTestId('user-progress-section')).toBeVisible();

      // Check enrolled courses
      const coursesSection = page.getByTestId('user-courses-section');
      await expect(coursesSection).toContainText('Introduction to TypeScript');
      await expect(coursesSection).toContainText('Advanced React Patterns');
    });
  });

  test.describe('User Registration', () => {
    test('register new account', async ({ page }) => {
      await page.goto('/register');

      // Fill registration form
      const newEmail = generateRandomEmail();
      await page.getByLabel('Email').fill(newEmail);
      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Full Name').fill('Test User');
      await page.getByLabel('Password').fill('TestUser123!');
      await page.getByLabel('Confirm Password').fill('TestUser123!');
      
      // Accept terms
      await page.getByLabel('I agree to the terms and conditions').check();

      // Submit form
      await page.getByRole('button', { name: 'Register' }).click();
      await waitForAPIResponse(page, '/api/v1/auth/register');

      // Should redirect to login with success message
      await page.waitForURL('/login');
      await expect(page.getByTestId('success-message')).toContainText('Registration successful. Please login.');
    });

    test('registration validation', async ({ page }) => {
      await page.goto('/register');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Register' }).click();

      // Should show validation errors
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Username is required')).toBeVisible();
      await expect(page.getByText('Password is required')).toBeVisible();

      // Test email validation
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Email').blur();
      await expect(page.getByText('Invalid email format')).toBeVisible();

      // Test password validation
      await page.getByLabel('Password').fill('weak');
      await page.getByLabel('Password').blur();
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    });
  });
});