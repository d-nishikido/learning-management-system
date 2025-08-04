import { test, expect } from '@playwright/test';

test.describe('Course Administration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to course management page', async ({ page }) => {
    await page.goto('/admin/courses');
    await expect(page.locator('h1')).toContainText('Course Management');
    await expect(page.locator('button')).toContainText('Create Course');
  });

  test('should display course creation form', async ({ page }) => {
    await page.goto('/admin/courses/new');
    await expect(page.locator('h1')).toContainText('Create Course');
    
    // Check all form fields are present
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="category"]')).toBeVisible();
    await expect(page.locator('select[name="difficultyLevel"]')).toBeVisible();
    await expect(page.locator('input[name="estimatedHours"]')).toBeVisible();
    await expect(page.locator('input[name="thumbnailUrl"]')).toBeVisible();
    await expect(page.locator('input[name="sortOrder"]')).toBeVisible();
    await expect(page.locator('input[name="isPublished"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/courses/new');
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Check validation errors appear
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Category is required')).toBeVisible();
  });

  test('should create a new course successfully', async ({ page }) => {
    await page.goto('/admin/courses/new');
    
    // Fill out the form
    await page.fill('input[name="title"]', 'Test E2E Course');
    await page.fill('textarea[name="description"]', 'This is a test course created via E2E testing');
    await page.fill('input[name="category"]', 'Testing');
    await page.selectOption('select[name="difficultyLevel"]', 'BEGINNER');
    await page.fill('input[name="estimatedHours"]', '5');
    await page.fill('input[name="sortOrder"]', '1');
    await page.check('input[name="isPublished"]');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to course management page with success message
    await page.waitForURL('/admin/courses');
    await expect(page.locator('text=Course created successfully')).toBeVisible();
    
    // Verify the course appears in the list
    await expect(page.locator('text=Test E2E Course')).toBeVisible();
  });

  test('should navigate to edit course form', async ({ page }) => {
    // Assuming there's at least one course in the system
    await page.goto('/admin/courses');
    
    // Wait for courses to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Click the first edit button
    const firstEditButton = page.locator('button:has-text("Edit")').first();
    await firstEditButton.click();
    
    // Should navigate to edit form
    await expect(page.locator('h1')).toContainText('Edit Course');
    
    // Form should be populated with existing data
    const titleField = page.locator('input[name="title"]');
    await expect(titleField).not.toHaveValue('');
  });

  test('should filter courses by category', async ({ page }) => {
    await page.goto('/admin/courses');
    
    // Wait for courses to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Fill in category filter
    await page.fill('input#category', 'Programming');
    await page.click('button[type="submit"]');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify search was performed (URL should contain the search params)
    expect(page.url()).toContain('category');
  });

  test('should handle course deletion with confirmation', async ({ page }) => {
    await page.goto('/admin/courses');
    
    // Wait for courses to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Set up dialog handler to cancel deletion
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure you want to delete');
      await dialog.dismiss();
    });
    
    // Click delete button for first course
    const firstDeleteButton = page.locator('button:has-text("Delete")').first();
    await firstDeleteButton.click();
    
    // Course should still be in the list (deletion was cancelled)
    await expect(page.locator('table tbody tr')).toHaveCount({ min: 1 });
  });

  test('should paginate course list', async ({ page }) => {
    await page.goto('/admin/courses');
    
    // Wait for courses to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check if pagination controls exist (only if there are multiple pages)
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Should be on page 2
      expect(page.url()).toContain('page');
    }
  });
});