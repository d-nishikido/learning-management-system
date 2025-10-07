import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Manual Progress Input', () => {
  test.beforeEach(async ({ authenticatedPage, page }) => {
    // Navigate to a lesson with manual progress materials
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/courses/1/lessons/1');
  });

  test.describe('Progress Input Form - タスク14.1', () => {
    test('displays progress input form for manual progress materials', async ({ page }) => {
      // Find a manual progress material
      const manualMaterial = page.locator('[data-allows-manual-progress="true"]').first();
      await expect(manualMaterial).toBeVisible();

      // Click to open material detail
      await manualMaterial.click();
      await page.waitForLoadState('networkidle');

      // Check progress input form exists
      const progressForm = page.getByTestId('progress-input-form');
      await expect(progressForm).toBeVisible();

      // Verify form elements
      await expect(page.getByLabel(/進捗率/)).toBeVisible();
      await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    });

    test('validates progress rate input (0-100 range)', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      const progressInput = page.getByLabel(/進捗率/);
      const submitButton = page.getByRole('button', { name: '保存' });

      // Test: value below 0
      await progressInput.fill('-10');
      await progressInput.blur();
      await expect(page.getByText('0-100の範囲で入力してください')).toBeVisible();

      // Test: value above 100
      await progressInput.fill('150');
      await progressInput.blur();
      await expect(page.getByText('0-100の範囲で入力してください')).toBeVisible();

      // Test: non-integer value
      await progressInput.fill('50.5');
      await progressInput.blur();
      await expect(page.getByText('整数を入力してください')).toBeVisible();

      // Test: valid value
      await progressInput.fill('75');
      await progressInput.blur();
      await expect(page.getByText(/0-100の範囲で入力してください|整数を入力してください/)).not.toBeVisible();
    });

    test('displays progress bar preview that updates in real-time', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      const progressInput = page.getByLabel(/進捗率/);
      const progressBar = page.locator('.bg-blue-600');

      // Initial state (assuming 0%)
      const initialWidth = await progressBar.evaluate(el => el.style.width);

      // Update progress
      await progressInput.fill('60');
      await page.waitForTimeout(500); // Wait for animation

      // Check progress bar updated
      const updatedWidth = await progressBar.evaluate(el => el.style.width);
      expect(updatedWidth).toBe('60%');

      // Check percentage text
      await expect(page.getByText('60%')).toBeVisible();
    });

    test('provides quick select buttons (0%, 25%, 50%, 75%, 100%)', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Verify all quick select buttons exist
      await expect(page.getByRole('button', { name: '0%' })).toBeVisible();
      await expect(page.getByRole('button', { name: '25%' })).toBeVisible();
      await expect(page.getByRole('button', { name: '50%' })).toBeVisible();
      await expect(page.getByRole('button', { name: '75%' })).toBeVisible();
      await expect(page.getByRole('button', { name: '100%' })).toBeVisible();

      // Test quick select functionality
      const progressInput = page.getByLabel(/進捗率/);
      
      await page.getByRole('button', { name: '75%' }).click();
      await expect(progressInput).toHaveValue('75');

      await page.getByRole('button', { name: '100%' }).click();
      await expect(progressInput).toHaveValue('100');
    });

    test('allows optional learning time and notes input', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Check learning time input
      const timeInput = page.getByLabel(/学習時間/);
      await expect(timeInput).toBeVisible();
      await expect(timeInput).toHaveAttribute('type', 'number');

      // Check notes textarea
      const notesInput = page.getByLabel(/メモ/);
      await expect(notesInput).toBeVisible();
      
      // Check character counter
      await notesInput.fill('テスト入力');
      await expect(page.getByText(/5\/1000/)).toBeVisible();
    });
  });

  test.describe('Progress Submission - タスク14.1', () => {
    test('successfully submits valid progress with success message', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      const progressInput = page.getByLabel(/進捗率/);
      const submitButton = page.getByRole('button', { name: '保存' });

      // Fill form
      await progressInput.fill('75');
      await page.getByLabel(/学習時間/).fill('30');
      await page.getByLabel(/メモ/).fill('Chapter 3まで完了');

      // Submit and wait for API response
      const responsePromise = waitForAPIResponse(page, '/api/v1/progress/materials/*/manual', 'PUT');
      await submitButton.click();
      await responsePromise;

      // Check success toast notification
      await expect(page.getByText('進捗率を更新しました')).toBeVisible({ timeout: 5000 });

      // Success message should disappear after 3 seconds
      await expect(page.getByText('進捗率を更新しました')).not.toBeVisible({ timeout: 4000 });
    });

    test('displays celebration message when reaching 100%', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      const progressInput = page.getByLabel(/進捗率/);
      const submitButton = page.getByRole('button', { name: '保存' });

      // Submit 100% progress
      await progressInput.fill('100');
      const responsePromise = waitForAPIResponse(page, '/api/v1/progress/materials/*/manual', 'PUT');
      await submitButton.click();
      await responsePromise;

      // Check celebration message
      await expect(page.getByText(/おめでとうございます！教材を完了しました/)).toBeVisible({ timeout: 5000 });
    });

    test('displays error message with retry button on failure', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Mock API error
      await page.route('**/api/v1/progress/materials/*/manual', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'ネットワークエラーが発生しました' })
        });
      });

      const progressInput = page.getByLabel(/進捗率/);
      const submitButton = page.getByRole('button', { name: '保存' });

      await progressInput.fill('75');
      await submitButton.click();

      // Check error toast with retry button
      await expect(page.getByText(/ネットワークエラーが発生しました/)).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
    });

    test('disables submit button during loading', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      const progressInput = page.getByLabel(/進捗率/);
      const submitButton = page.getByRole('button', { name: '保存' });

      await progressInput.fill('75');

      // Slow down API response
      await page.route('**/api/v1/progress/materials/*/manual', async route => {
        await page.waitForTimeout(2000);
        await route.continue();
      });

      await submitButton.click();

      // Check button is disabled during loading
      await expect(submitButton).toBeDisabled();
      await expect(page.getByRole('button', { name: '保存中...' })).toBeVisible();

      // Wait for completion
      await page.waitForTimeout(3000);
    });
  });

  test.describe('Progress History - タスク14.1', () => {
    test('switches to history tab and displays progress history', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Click history tab
      const historyTab = page.getByRole('button', { name: '進捗履歴' });
      await historyTab.click();

      // Wait for history API response
      await waitForAPIResponse(page, '/api/v1/progress/materials/*/history');

      // Check history list is visible
      const historyList = page.getByTestId('progress-history-list');
      await expect(historyList).toBeVisible();
    });

    test('displays history entries with date, rate, and delta', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Switch to history tab
      await page.getByRole('button', { name: '進捗履歴' }).click();
      await waitForAPIResponse(page, '/api/v1/progress/materials/*/history');

      // Check history entries
      const historyEntries = page.locator('[data-testid="history-entry"]');
      const count = await historyEntries.count();

      if (count > 0) {
        const firstEntry = historyEntries.first();
        
        // Check progress rate display
        await expect(firstEntry.locator('.text-2xl')).toBeVisible();
        
        // Check date display
        await expect(firstEntry.getByText(/2025/)).toBeVisible();
        
        // Check delta (if present)
        const deltaElement = firstEntry.locator('[class*="text-green-600"],[class*="text-red-600"]');
        if (await deltaElement.count() > 0) {
          await expect(deltaElement.first()).toBeVisible();
        }
      }
    });

    test('displays empty state when no history exists', async ({ page }) => {
      await page.goto('/materials/999'); // Material with no history
      
      // Switch to history tab
      await page.getByRole('button', { name: '進捗履歴' }).click();
      await page.waitForTimeout(1000);

      // Check empty state message
      await expect(page.getByText('まだ進捗の記録がありません')).toBeVisible();
    });

    test('refreshes history after progress submission', async ({ page }) => {
      await page.goto('/materials/1');
      await waitForAPIResponse(page, '/api/v1/materials/1');

      // Submit progress
      await page.getByLabel(/進捗率/).fill('80');
      const responsePromise = waitForAPIResponse(page, '/api/v1/progress/materials/*/manual', 'PUT');
      await page.getByRole('button', { name: '保存' }).click();
      await responsePromise;

      // Wait for success message
      await expect(page.getByText('進捗率を更新しました')).toBeVisible({ timeout: 5000 });

      // Switch to history tab
      await page.getByRole('button', { name: '進捗履歴' }).click();
      await waitForAPIResponse(page, '/api/v1/progress/materials/*/history');

      // Check that new entry appears (80%)
      await expect(page.getByText('80%')).toBeVisible();
    });
  });

  test.describe('Complete User Journey - タスク14.1', () => {
    test('completes full progress tracking workflow', async ({ page }) => {
      // 1. Navigate to material
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/courses/1/lessons/1');

      const material = page.locator('[data-allows-manual-progress="true"]').first();
      await material.click();
      await page.waitForLoadState('networkidle');

      // 2. Input progress with quick select
      await page.getByRole('button', { name: '50%' }).click();
      await expect(page.getByLabel(/進捗率/)).toHaveValue('50');

      // 3. Add learning time and notes
      await page.getByLabel(/学習時間/).fill('45');
      await page.getByLabel(/メモ/).fill('前半部分の学習完了');

      // 4. Submit
      const responsePromise = waitForAPIResponse(page, '/api/v1/progress/materials/*/manual', 'PUT');
      await page.getByRole('button', { name: '保存' }).click();
      await responsePromise;

      // 5. Verify success
      await expect(page.getByText('進捗率を更新しました')).toBeVisible({ timeout: 5000 });

      // 6. Check history
      await page.getByRole('button', { name: '進捗履歴' }).click();
      await waitForAPIResponse(page, '/api/v1/progress/materials/*/history');
      await expect(page.getByText('50%')).toBeVisible();
      await expect(page.getByText('前半部分の学習完了')).toBeVisible();

      // 7. Update to 100%
      await page.getByRole('button', { name: '進捗率入力' }).click();
      await page.getByRole('button', { name: '100%' }).click();
      
      const completionPromise = waitForAPIResponse(page, '/api/v1/progress/materials/*/manual', 'PUT');
      await page.getByRole('button', { name: '保存' }).click();
      await completionPromise;

      // 8. Verify completion message
      await expect(page.getByText(/おめでとうございます！教材を完了しました/)).toBeVisible({ timeout: 5000 });
    });
  });
});
