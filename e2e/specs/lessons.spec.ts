import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Lessons', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated
  });

  test.describe('Lesson Detail Page', () => {
    test('displays lesson information correctly', async ({ page }) => {
      // Navigate to a lesson detail page
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1');

      // Check lesson title
      const lessonTitle = page.getByTestId('lesson-title');
      await expect(lessonTitle).toBeVisible();
      await expect(lessonTitle).toContainText('Getting Started with TypeScript');

      // Check lesson description
      const lessonDescription = page.getByTestId('lesson-description');
      await expect(lessonDescription).toBeVisible();

      // Check lesson duration if available
      const lessonDuration = page.getByTestId('lesson-duration');
      await expect(lessonDuration).toBeVisible();
    });

    test('displays lesson materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Check materials section
      const materialsSection = page.getByTestId('lesson-materials');
      await expect(materialsSection).toBeVisible();

      // Check individual material items
      const materialItems = materialsSection.locator('.material-item');
      const materialCount = await materialItems.count();
      expect(materialCount).toBeGreaterThan(0);

      // Check first material item
      const firstMaterial = materialItems.first();
      await expect(firstMaterial.getByTestId('material-title')).toBeVisible();
      await expect(firstMaterial.getByTestId('material-type')).toBeVisible();
    });

    test('allows material interaction - file download', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a file material and click download
      const fileMaterial = page.locator('.material-item[data-type="file"]').first();
      
      if (await fileMaterial.isVisible()) {
        const downloadButton = fileMaterial.getByRole('button', { name: 'Download' });
        
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|txt|ppt)$/i);
      }
    });

    test('allows material interaction - external URL', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a URL material and click it
      const urlMaterial = page.locator('.material-item[data-type="url"]').first();
      
      if (await urlMaterial.isVisible()) {
        const urlLink = urlMaterial.getByRole('link', { name: /View|Open/i });
        
        // Check that link opens in new tab
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page'),
          urlLink.click()
        ]);
        
        await newPage.waitForLoadState();
        expect(newPage.url()).toMatch(/^https?:\/\//);
        await newPage.close();
      }
    });

    test('tracks manual progress for external materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a manual progress material
      const manualMaterial = page.locator('.material-item[data-type="manual"]').first();
      
      if (await manualMaterial.isVisible()) {
        // Click to mark as accessed
        const accessButton = manualMaterial.getByRole('button', { name: 'Mark as Viewed' });
        await accessButton.click();

        // Wait for API call
        await waitForAPIResponse(page, '**/api/v1/progress/manual');

        // Check that button changes state
        await expect(manualMaterial.getByRole('button', { name: 'Viewed' })).toBeVisible();

        // Fill manual progress form if available
        const progressInput = manualMaterial.getByLabel('Study time (minutes)');
        if (await progressInput.isVisible()) {
          await progressInput.fill('45');
          
          const saveButton = manualMaterial.getByRole('button', { name: 'Save Progress' });
          await saveButton.click();
          
          await waitForAPIResponse(page, '**/api/v1/progress/manual', 200);
        }
      }
    });

    test('displays lesson progress indicator', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/progress');

      // Check progress bar
      const progressBar = page.getByTestId('lesson-progress-bar');
      await expect(progressBar).toBeVisible();

      // Check progress percentage
      const progressText = page.getByTestId('lesson-progress-text');
      await expect(progressText).toBeVisible();
      await expect(progressText).toContainText(/\d+%/);
    });

    test('marks lesson as complete', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1');

      // Find and click complete lesson button
      const completeButton = page.getByRole('button', { name: 'Mark Lesson Complete' });
      await expect(completeButton).toBeVisible();
      
      await completeButton.click();
      await waitForAPIResponse(page, '/api/v1/lessons/1/complete');

      // Check success message
      const successMessage = page.getByTestId('success-message');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('Lesson completed successfully');

      // Check that button changes state
      await expect(page.getByRole('button', { name: 'Lesson Complete' })).toBeVisible();
    });
  });

  test.describe('Lesson Navigation', () => {
    test('navigates to previous lesson', async ({ page }) => {
      await page.goto('/courses/1/lessons/2');
      await waitForAPIResponse(page, '/api/v1/lessons/2');

      // Click previous lesson button
      const prevButton = page.getByRole('button', { name: 'Previous Lesson' });
      await expect(prevButton).toBeVisible();
      
      await prevButton.click();
      await page.waitForURL('/courses/1/lessons/1');
      expect(page.url()).toContain('/courses/1/lessons/1');
    });

    test('navigates to next lesson', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1');

      // Click next lesson button
      const nextButton = page.getByRole('button', { name: 'Next Lesson' });
      await expect(nextButton).toBeVisible();
      
      await nextButton.click();
      await page.waitForURL('/courses/1/lessons/2');
      expect(page.url()).toContain('/courses/1/lessons/2');
    });

    test('returns to course overview', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');

      // Click back to course button
      const backButton = page.getByRole('link', { name: 'Back to Course' });
      await expect(backButton).toBeVisible();
      
      await backButton.click();
      await page.waitForURL('/courses/1');
      expect(page.url()).toContain('/courses/1');
    });
  });

  test.describe('Lesson Comments and Notes', () => {
    test('allows adding personal notes', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');

      // Find notes section
      const notesSection = page.getByTestId('lesson-notes-section');
      if (await notesSection.isVisible()) {
        const notesTextarea = notesSection.getByRole('textbox', { name: 'Personal Notes' });
        await notesTextarea.fill('This is my personal note about TypeScript basics');

        const saveNotesButton = notesSection.getByRole('button', { name: 'Save Notes' });
        await saveNotesButton.click();

        await waitForAPIResponse(page, '**/api/v1/lessons/1/notes');

        // Check success confirmation
        const successMessage = page.getByTestId('notes-success-message');
        await expect(successMessage).toBeVisible();
      }
    });

    test('displays existing notes on page load', async ({ page }) => {
      // Mock existing notes
      await page.route('**/api/v1/lessons/1/notes', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notes: 'My existing notes about TypeScript'
            }
          })
        });
      });

      await page.goto('/courses/1/lessons/1');

      const notesSection = page.getByTestId('lesson-notes-section');
      if (await notesSection.isVisible()) {
        const notesTextarea = notesSection.getByRole('textbox', { name: 'Personal Notes' });
        await expect(notesTextarea).toHaveValue('My existing notes about TypeScript');
      }
    });
  });

  test.describe('Lesson Error Handling', () => {
    test('handles lesson not found', async ({ page }) => {
      await page.goto('/courses/1/lessons/999');

      // Should show 404 or not found message
      const errorMessage = page.getByTestId('lesson-not-found');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Lesson not found');
    });

    test('handles materials loading error', async ({ page }) => {
      await page.route('**/api/v1/lessons/1/materials', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to load materials'
          })
        });
      });

      await page.goto('/courses/1/lessons/1');

      const errorMessage = page.getByTestId('materials-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Unable to load lesson materials');
    });

    test('handles completion error gracefully', async ({ page }) => {
      await page.route('**/api/v1/lessons/1/complete', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Cannot complete lesson'
          })
        });
      });

      await page.goto('/courses/1/lessons/1');

      const completeButton = page.getByRole('button', { name: 'Mark Lesson Complete' });
      await completeButton.click();

      const errorMessage = page.getByTestId('completion-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Failed to mark lesson as complete');
    });
  });

  test.describe('Lesson Accessibility', () => {
    test('supports keyboard navigation', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate buttons with keyboard
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('has proper heading structure', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');

      // Check heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      
      const h2 = page.locator('h2');
      await expect(h2.first()).toBeVisible();
    });

    test('has proper ARIA labels', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');

      // Check important interactive elements have ARIA labels
      const completeButton = page.getByRole('button', { name: 'Mark Lesson Complete' });
      if (await completeButton.isVisible()) {
        await expect(completeButton).toHaveAttribute('aria-label');
      }
    });
  });
});