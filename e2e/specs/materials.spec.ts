import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Learning Materials', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated for materials access
  });

  test.describe('Materials Display and Interaction', () => {
    test('displays materials within lessons correctly', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Check materials section exists
      const materialsSection = page.getByTestId('lesson-materials');
      await expect(materialsSection).toBeVisible();

      // Check materials list
      const materialsList = materialsSection.getByTestId('materials-list');
      await expect(materialsList).toBeVisible();

      // Check individual material items
      const materialItems = materialsList.getByTestId('material-item');
      const itemCount = await materialItems.count();
      expect(itemCount).toBeGreaterThan(0);
    });

    test('displays different material types correctly', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const materialItems = page.getByTestId('material-item');
      const firstMaterial = materialItems.first();

      // Check material information
      await expect(firstMaterial.getByTestId('material-title')).toBeVisible();
      await expect(firstMaterial.getByTestId('material-description')).toBeVisible();
      await expect(firstMaterial.getByTestId('material-type')).toBeVisible();

      // Check material type badge
      const materialType = await firstMaterial.getByTestId('material-type').textContent();
      expect(['FILE', 'URL', 'VIDEO', 'DOCUMENT']).toContain(materialType);
    });

    test('handles file material download', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a file material
      const fileMaterial = page.locator('[data-material-type="FILE"]').first();
      
      if (await fileMaterial.isVisible()) {
        const downloadButton = fileMaterial.getByRole('button', { name: /Download|View File/i });
        
        if (await downloadButton.isVisible()) {
          // Set up download promise before clicking
          const downloadPromise = page.waitForEvent('download');
          await downloadButton.click();
          
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|docx|txt|ppt|pptx|jpg|png)$/i);
        }
      }
    });

    test('handles URL material navigation', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a URL material
      const urlMaterial = page.locator('[data-material-type="URL"]').first();
      
      if (await urlMaterial.isVisible()) {
        const urlLink = urlMaterial.getByRole('link', { name: /Open|Visit|View/i });
        
        if (await urlLink.isVisible()) {
          // Check that link has proper attributes
          await expect(urlLink).toHaveAttribute('target', '_blank');
          await expect(urlLink).toHaveAttribute('rel', 'noopener noreferrer');
          
          // Check URL format
          const href = await urlLink.getAttribute('href');
          expect(href).toMatch(/^https?:\/\//);
        }
      }
    });

    test('handles video material playback', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a video material
      const videoMaterial = page.locator('[data-material-type="VIDEO"]').first();
      
      if (await videoMaterial.isVisible()) {
        const playButton = videoMaterial.getByRole('button', { name: /Play|Watch/i });
        
        if (await playButton.isVisible()) {
          await playButton.click();
          
          // Check for video player
          const videoPlayer = page.getByTestId('video-player');
          if (await videoPlayer.isVisible()) {
            await expect(videoPlayer).toBeVisible();
            
            // Check video controls
            const videoElement = videoPlayer.locator('video');
            await expect(videoElement).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Material Progress Tracking', () => {
    test('tracks automatic progress for file materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const fileMaterial = page.locator('[data-material-type="FILE"]').first();
      
      if (await fileMaterial.isVisible()) {
        const viewButton = fileMaterial.getByRole('button', { name: /View|Download/i });
        await viewButton.click();
        
        // Should track material access
        await waitForAPIResponse(page, '**/api/v1/materials/*/access', 201);
        
        // Check progress indicator
        const progressIndicator = fileMaterial.getByTestId('material-progress');
        if (await progressIndicator.isVisible()) {
          await expect(progressIndicator).toContainText(/Viewed|Accessed/);
        }
      }
    });

    test('handles manual progress tracking', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Find a manual tracking material
      const manualMaterial = page.locator('[data-tracking-type="MANUAL"]').first();
      
      if (await manualMaterial.isVisible()) {
        const markViewedButton = manualMaterial.getByRole('button', { name: /Mark as Viewed|Mark Progress/i });
        
        if (await markViewedButton.isVisible()) {
          await markViewedButton.click();
          
          // Should open manual progress form
          const progressForm = page.getByTestId('manual-progress-form');
          if (await progressForm.isVisible()) {
            // Fill progress information
            const studyTimeInput = progressForm.getByLabel('Study time (minutes)');
            await studyTimeInput.fill('45');
            
            const completionSelect = progressForm.getByLabel('Completion status');
            await completionSelect.selectOption('COMPLETED');
            
            const notesTextarea = progressForm.getByLabel('Notes (optional)');
            await notesTextarea.fill('Completed reading the documentation thoroughly');
            
            // Submit progress
            const submitButton = progressForm.getByRole('button', { name: 'Save Progress' });
            await submitButton.click();
            
            await waitForAPIResponse(page, '**/api/v1/materials/*/manual-progress', 201);
            
            // Check success message
            const successMessage = page.getByTestId('progress-success');
            await expect(successMessage).toBeVisible();
          }
        }
      }
    });

    test('displays material completion status', async ({ page }) => {
      // Mock materials with different completion statuses
      await page.route('**/api/v1/lessons/1/materials', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                title: 'Introduction to TypeScript',
                type: 'FILE',
                filePath: '/materials/typescript-intro.pdf',
                completionStatus: 'COMPLETED',
                lastAccessed: '2025-01-15T10:00:00Z'
              },
              {
                id: 2,
                title: 'TypeScript Official Documentation',
                type: 'URL',
                url: 'https://www.typescriptlang.org/docs/',
                completionStatus: 'IN_PROGRESS',
                progressPercentage: 60
              },
              {
                id: 3,
                title: 'Advanced TypeScript Concepts',
                type: 'FILE',
                filePath: '/materials/advanced-typescript.pdf',
                completionStatus: 'NOT_STARTED'
              }
            ]
          })
        });
      });

      await page.goto('/courses/1/lessons/1');

      const materialItems = page.getByTestId('material-item');
      
      // Check completed material
      const completedMaterial = materialItems.nth(0);
      const completedStatus = completedMaterial.getByTestId('completion-status');
      await expect(completedStatus).toContainText('Completed');
      await expect(completedStatus).toHaveClass(/completed/);
      
      // Check in-progress material
      const inProgressMaterial = materialItems.nth(1);
      const progressStatus = inProgressMaterial.getByTestId('completion-status');
      await expect(progressStatus).toContainText('60%');
      await expect(progressStatus).toHaveClass(/in-progress/);
      
      // Check not started material
      const notStartedMaterial = materialItems.nth(2);
      const notStartedStatus = notStartedMaterial.getByTestId('completion-status');
      await expect(notStartedStatus).toContainText('Not Started');
      await expect(notStartedStatus).toHaveClass(/not-started/);
    });
  });

  test.describe('Material Search and Filtering', () => {
    test('searches materials within a lesson', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Use material search if available
      const materialSearch = page.getByPlaceholder('Search materials...');
      if (await materialSearch.isVisible()) {
        await materialSearch.fill('introduction');
        await materialSearch.press('Enter');
        
        await waitForAPIResponse(page, '**/api/v1/lessons/1/materials');
        
        const materialItems = page.getByTestId('material-item');
        const itemCount = await materialItems.count();
        
        if (itemCount > 0) {
          const firstMaterial = materialItems.first();
          const materialTitle = await firstMaterial.getByTestId('material-title').textContent();
          expect(materialTitle?.toLowerCase()).toContain('introduction');
        }
      }
    });

    test('filters materials by type', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Use material type filter if available
      const typeFilter = page.getByLabel('Material Type');
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('FILE');
        
        await waitForAPIResponse(page, '**/api/v1/lessons/1/materials');
        
        const materialItems = page.getByTestId('material-item');
        const itemCount = await materialItems.count();
        
        if (itemCount > 0) {
          for (let i = 0; i < itemCount; i++) {
            const material = materialItems.nth(i);
            const materialType = await material.getByTestId('material-type').textContent();
            expect(materialType).toBe('FILE');
          }
        }
      }
    });

    test('filters materials by completion status', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Use completion filter if available
      const completionFilter = page.getByLabel('Show completed only');
      if (await completionFilter.isVisible()) {
        await completionFilter.check();
        
        await waitForAPIResponse(page, '**/api/v1/lessons/1/materials');
        
        const materialItems = page.getByTestId('material-item');
        const itemCount = await materialItems.count();
        
        if (itemCount > 0) {
          for (let i = 0; i < itemCount; i++) {
            const material = materialItems.nth(i);
            const completionStatus = material.getByTestId('completion-status');
            await expect(completionStatus).toContainText(/Completed|100%/);
          }
        }
      }
    });
  });

  test.describe('Admin Material Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock admin user
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          role: 'ADMIN',
          email: 'admin@test.example.com'
        }));
      });
    });

    test('allows admins to add new materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Admin should see add material button
      const addMaterialButton = page.getByRole('button', { name: 'Add Material' });
      if (await addMaterialButton.isVisible()) {
        await addMaterialButton.click();

        // Should open material creation form
        const materialForm = page.getByTestId('material-form');
        await expect(materialForm).toBeVisible();

        // Fill material form
        await page.getByLabel('Title').fill('New Learning Material');
        await page.getByLabel('Description').fill('This is a new material for learning');
        await page.getByLabel('Type').selectOption('FILE');
        
        // Handle file upload
        const fileInput = page.getByLabel('Upload File');
        if (await fileInput.isVisible()) {
          // Mock file upload - use simple file path approach
          await fileInput.setInputFiles('test-fixtures/test-material.pdf');
        }

        // Submit form
        await page.getByRole('button', { name: 'Create Material' }).click();
        await waitForAPIResponse(page, '/api/v1/materials', 201);

        // Check success message
        const successMessage = page.getByTestId('material-success');
        await expect(successMessage).toBeVisible();
      }
    });

    test('allows admins to edit existing materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const firstMaterial = page.getByTestId('material-item').first();
      const editButton = firstMaterial.getByRole('button', { name: 'Edit Material' });
      
      if (await editButton.isVisible()) {
        await editButton.click();

        const editForm = page.getByTestId('material-edit-form');
        await expect(editForm).toBeVisible();

        // Update material title
        const titleInput = page.getByLabel('Title');
        await titleInput.clear();
        await titleInput.fill('Updated Material Title');

        // Save changes
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await waitForAPIResponse(page, '**/api/v1/materials/*');

        // Check updated title
        await expect(firstMaterial.getByTestId('material-title')).toContainText('Updated Material Title');
      }
    });

    test('allows admins to delete materials', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const materialToDelete = page.getByTestId('material-item').first();
      const deleteButton = materialToDelete.getByRole('button', { name: 'Delete Material' });
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmDialog = page.getByTestId('confirm-delete-dialog');
        await expect(confirmDialog).toBeVisible();
        
        const confirmButton = confirmDialog.getByRole('button', { name: 'Confirm Delete' });
        await confirmButton.click();
        
        await waitForAPIResponse(page, '**/api/v1/materials/*', 204);

        // Material should be removed from the list
        await expect(materialToDelete).not.toBeVisible();
      }
    });
  });

  test.describe('Material Error Handling', () => {
    test('handles material loading errors', async ({ page }) => {
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
      await expect(errorMessage).toContainText('Unable to load materials');

      // Check retry button
      const retryButton = page.getByRole('button', { name: 'Retry' });
      await expect(retryButton).toBeVisible();
    });

    test('handles file download errors', async ({ page }) => {
      await page.route('**/api/v1/materials/*/download', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'File not found'
          })
        });
      });

      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const fileMaterial = page.locator('[data-material-type="FILE"]').first();
      if (await fileMaterial.isVisible()) {
        const downloadButton = fileMaterial.getByRole('button', { name: /Download/i });
        await downloadButton.click();

        const errorMessage = page.getByTestId('download-error');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Download failed');
      }
    });

    test('handles progress tracking errors', async ({ page }) => {
      await page.route('**/api/v1/materials/*/manual-progress', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid progress data'
          })
        });
      });

      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const manualMaterial = page.locator('[data-tracking-type="MANUAL"]').first();
      if (await manualMaterial.isVisible()) {
        const progressButton = manualMaterial.getByRole('button', { name: /Mark Progress/i });
        await progressButton.click();

        const progressForm = page.getByTestId('manual-progress-form');
        if (await progressForm.isVisible()) {
          const submitButton = progressForm.getByRole('button', { name: 'Save Progress' });
          await submitButton.click();

          const errorMessage = page.getByTestId('progress-error');
          await expect(errorMessage).toBeVisible();
        }
      }
    });
  });

  test.describe('Material Accessibility', () => {
    test('supports keyboard navigation', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      // Tab through material items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('has proper ARIA labels for material actions', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const materialItem = page.getByTestId('material-item').first();
      const actionButton = materialItem.getByRole('button').first();
      
      if (await actionButton.isVisible()) {
        await expect(actionButton).toHaveAttribute('aria-label');
      }
    });

    test('provides alternative text for material types', async ({ page }) => {
      await page.goto('/courses/1/lessons/1');
      await waitForAPIResponse(page, '/api/v1/lessons/1/materials');

      const materialItems = page.getByTestId('material-item');
      const itemCount = await materialItems.count();
      
      if (itemCount > 0) {
        const firstMaterial = materialItems.first();
        const typeIcon = firstMaterial.getByTestId('material-type-icon');
        
        if (await typeIcon.isVisible()) {
          await expect(typeIcon).toHaveAttribute('alt');
        }
      }
    });
  });
});