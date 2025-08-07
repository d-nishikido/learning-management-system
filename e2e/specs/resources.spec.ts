import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Resource Library', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated for full resource access
  });

  test.describe('Resource Library Page', () => {
    test('displays resource library correctly', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Check page title
      const pageTitle = page.getByTestId('page-title');
      await expect(pageTitle).toBeVisible();
      await expect(pageTitle).toContainText('Resource Library');

      // Check resources grid/list
      const resourcesGrid = page.getByTestId('resources-grid');
      await expect(resourcesGrid).toBeVisible();

      // Check individual resource cards
      const resourceCards = page.getByTestId('resource-card');
      const cardCount = await resourceCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('displays resource information correctly', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      const firstResource = page.getByTestId('resource-card').first();
      
      // Check resource title
      const resourceTitle = firstResource.getByTestId('resource-title');
      await expect(resourceTitle).toBeVisible();

      // Check resource description
      const resourceDescription = firstResource.getByTestId('resource-description');
      await expect(resourceDescription).toBeVisible();

      // Check resource type badge
      const resourceType = firstResource.getByTestId('resource-type');
      await expect(resourceType).toBeVisible();

      // Check resource category
      const resourceCategory = firstResource.getByTestId('resource-category');
      await expect(resourceCategory).toBeVisible();
    });

    test('filters resources by category', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Select a specific category
      const categoryFilter = page.getByLabel('Category');
      await categoryFilter.selectOption('Documentation');
      
      await waitForAPIResponse(page, '/api/v1/resources');

      // Check that filtered results are displayed
      const resourceCards = page.getByTestId('resource-card');
      const cardCount = await resourceCards.count();
      
      if (cardCount > 0) {
        const firstCard = resourceCards.first();
        const category = firstCard.getByTestId('resource-category');
        await expect(category).toContainText('Documentation');
      }
    });

    test('filters resources by type', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Select resource type filter
      const typeFilter = page.getByLabel('Resource Type');
      await typeFilter.selectOption('Video');
      
      await waitForAPIResponse(page, '/api/v1/resources');

      // Verify filtered results
      const resourceCards = page.getByTestId('resource-card');
      const cardCount = await resourceCards.count();
      
      if (cardCount > 0) {
        const firstCard = resourceCards.first();
        const type = firstCard.getByTestId('resource-type');
        await expect(type).toContainText('Video');
      }
    });

    test('searches resources', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Use search functionality
      const searchInput = page.getByPlaceholder('Search resources...');
      await searchInput.fill('JavaScript');
      await searchInput.press('Enter');
      
      await waitForAPIResponse(page, '/api/v1/resources');

      // Check search results
      const resourceCards = page.getByTestId('resource-card');
      const cardCount = await resourceCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);

      // If results exist, verify they match search term
      if (cardCount > 0) {
        const firstCard = resourceCards.first();
        const cardText = await firstCard.textContent();
        expect(cardText?.toLowerCase()).toContain('javascript');
      }
    });
  });

  test.describe('Resource Detail Page', () => {
    test('displays resource details correctly', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Check resource title
      const resourceTitle = page.getByTestId('resource-title');
      await expect(resourceTitle).toBeVisible();

      // Check resource description
      const resourceDescription = page.getByTestId('resource-description');
      await expect(resourceDescription).toBeVisible();

      // Check resource metadata
      const resourceMeta = page.getByTestId('resource-metadata');
      await expect(resourceMeta).toBeVisible();

      // Check resource type and category
      const resourceType = page.getByTestId('resource-type');
      const resourceCategory = page.getByTestId('resource-category');
      await expect(resourceType).toBeVisible();
      await expect(resourceCategory).toBeVisible();
    });

    test('handles different resource types - URL resources', async ({ page }) => {
      // Mock URL resource
      await page.route('**/api/v1/resources/1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              title: 'MDN JavaScript Documentation',
              description: 'Comprehensive JavaScript documentation',
              type: 'URL',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
              category: 'Documentation'
            }
          })
        });
      });

      await page.goto('/resources/1');

      // Check URL resource specific elements
      const externalLink = page.getByRole('link', { name: 'Open Resource' });
      await expect(externalLink).toBeVisible();
      await expect(externalLink).toHaveAttribute('href', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript');
      await expect(externalLink).toHaveAttribute('target', '_blank');
    });

    test('handles different resource types - File resources', async ({ page }) => {
      // Mock file resource
      await page.route('**/api/v1/resources/2', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 2,
              title: 'TypeScript Cheat Sheet',
              description: 'Quick reference for TypeScript syntax',
              type: 'FILE',
              filePath: '/uploads/resources/typescript-cheatsheet.pdf',
              fileName: 'typescript-cheatsheet.pdf',
              fileSize: '2.3 MB',
              category: 'Reference'
            }
          })
        });
      });

      await page.goto('/resources/2');

      // Check file resource specific elements
      const downloadButton = page.getByRole('button', { name: 'Download' });
      await expect(downloadButton).toBeVisible();

      const fileInfo = page.getByTestId('file-info');
      await expect(fileInfo).toBeVisible();
      await expect(fileInfo).toContainText('2.3 MB');
      await expect(fileInfo).toContainText('PDF');
    });

    test('handles file download', async ({ page }) => {
      await page.goto('/resources/2');
      await waitForAPIResponse(page, '/api/v1/resources/2');

      const downloadButton = page.getByRole('button', { name: 'Download' });
      
      if (await downloadButton.isVisible()) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|txt|ppt)$/i);
      }
    });

    test('tracks resource access', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Click on resource to access it
      const accessButton = page.getByRole('button', { name: /Open|Download|View/i });
      
      if (await accessButton.isVisible()) {
        await accessButton.click();
        
        // Should track the access
        await waitForAPIResponse(page, '**/api/v1/resources/1/access', 201);
      }
    });
  });

  test.describe('Resource Bookmarking', () => {
    test('bookmarks and unbookmarks resources', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Find bookmark button
      const bookmarkButton = page.getByRole('button', { name: /Bookmark|Add to Favorites/i });
      await expect(bookmarkButton).toBeVisible();

      // Bookmark the resource
      await bookmarkButton.click();
      await waitForAPIResponse(page, '**/api/v1/resources/1/bookmark', 201);

      // Check that button state changed
      await expect(page.getByRole('button', { name: /Bookmarked|Remove from Favorites/i })).toBeVisible();

      // Unbookmark
      const unbookmarkButton = page.getByRole('button', { name: /Bookmarked|Remove from Favorites/i });
      await unbookmarkButton.click();
      await waitForAPIResponse(page, '**/api/v1/resources/1/bookmark', 200);

      // Button should change back
      await expect(page.getByRole('button', { name: /Bookmark|Add to Favorites/i })).toBeVisible();
    });

    test('displays bookmarked resources', async ({ page }) => {
      await page.goto('/resources?filter=bookmarked');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Check bookmarked resources section
      const bookmarkedSection = page.getByTestId('bookmarked-resources');
      if (await bookmarkedSection.isVisible()) {
        const bookmarkedCards = bookmarkedSection.getByTestId('resource-card');
        const cardCount = await bookmarkedCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0);

        // Each bookmarked item should have bookmark indicator
        if (cardCount > 0) {
          const firstCard = bookmarkedCards.first();
          const bookmarkIcon = firstCard.getByTestId('bookmark-indicator');
          await expect(bookmarkIcon).toBeVisible();
        }
      }
    });
  });

  test.describe('Resource Comments and Ratings', () => {
    test('displays resource ratings', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Check rating display
      const ratingSection = page.getByTestId('resource-rating');
      if (await ratingSection.isVisible()) {
        const averageRating = ratingSection.getByTestId('average-rating');
        const ratingCount = ratingSection.getByTestId('rating-count');
        
        await expect(averageRating).toBeVisible();
        await expect(ratingCount).toBeVisible();
      }
    });

    test('allows user to rate resource', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Find rating stars
      const ratingStars = page.getByTestId('rating-stars');
      if (await ratingStars.isVisible()) {
        // Click on 4th star to give 4-star rating
        const fourthStar = ratingStars.locator('.star').nth(3);
        await fourthStar.click();

        await waitForAPIResponse(page, '**/api/v1/resources/1/rate', 201);

        // Check success message
        const successMessage = page.getByTestId('rating-success');
        await expect(successMessage).toBeVisible();
      }
    });

    test('displays and allows comments', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Check comments section
      const commentsSection = page.getByTestId('resource-comments');
      if (await commentsSection.isVisible()) {
        // Add new comment
        const commentForm = commentsSection.getByTestId('comment-form');
        if (await commentForm.isVisible()) {
          const commentInput = commentForm.getByRole('textbox', { name: 'Add comment' });
          await commentInput.fill('This resource was very helpful!');

          const submitButton = commentForm.getByRole('button', { name: 'Post Comment' });
          await submitButton.click();

          await waitForAPIResponse(page, '**/api/v1/resources/1/comments', 201);

          // Check success message
          const successMessage = page.getByTestId('comment-success');
          await expect(successMessage).toBeVisible();
        }
      }
    });
  });

  test.describe('Admin Resource Management', () => {
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

    test('creates new resource', async ({ page }) => {
      await page.goto('/resources');

      // Admin should see create button
      const createButton = page.getByRole('button', { name: 'Add Resource' });
      await expect(createButton).toBeVisible();
      
      await createButton.click();

      // Should open resource form
      const resourceForm = page.getByTestId('resource-form');
      await expect(resourceForm).toBeVisible();

      // Fill form
      await page.getByLabel('Title').fill('New Test Resource');
      await page.getByLabel('Description').fill('This is a test resource');
      await page.getByLabel('Category').selectOption('Tools');
      await page.getByLabel('Type').selectOption('URL');
      await page.getByLabel('URL').fill('https://example.com');

      // Submit form
      await page.getByRole('button', { name: 'Create Resource' }).click();
      await waitForAPIResponse(page, '/api/v1/resources', 201);

      // Should redirect to new resource
      await page.waitForURL(/\/resources\/\d+/);
    });

    test('edits existing resource', async ({ page }) => {
      await page.goto('/resources/1');

      // Admin should see edit button
      const editButton = page.getByRole('button', { name: 'Edit Resource' });
      await expect(editButton).toBeVisible();
      
      await editButton.click();

      // Should show edit form
      const editForm = page.getByTestId('resource-edit-form');
      await expect(editForm).toBeVisible();

      // Update title
      const titleInput = page.getByLabel('Title');
      await titleInput.clear();
      await titleInput.fill('Updated Resource Title');

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Should show updated title
      const resourceTitle = page.getByTestId('resource-title');
      await expect(resourceTitle).toHaveText('Updated Resource Title');
    });

    test('deletes resource', async ({ page }) => {
      await page.goto('/resources/1');

      // Admin should see delete button
      const deleteButton = page.getByRole('button', { name: 'Delete Resource' });
      await expect(deleteButton).toBeVisible();
      
      await deleteButton.click();

      // Confirm deletion
      const confirmDialog = page.getByTestId('confirm-dialog');
      await expect(confirmDialog).toBeVisible();
      
      const confirmButton = confirmDialog.getByRole('button', { name: 'Confirm Delete' });
      await confirmButton.click();
      
      await waitForAPIResponse(page, '/api/v1/resources/1', 204);

      // Should redirect to resources list
      await page.waitForURL('/resources');
    });
  });

  test.describe('Resource Error Handling', () => {
    test('handles resource not found', async ({ page }) => {
      await page.goto('/resources/999');

      // Should show 404 message
      const notFoundMessage = page.getByTestId('resource-not-found');
      await expect(notFoundMessage).toBeVisible();
      await expect(notFoundMessage).toContainText('Resource not found');
    });

    test('handles resource loading error', async ({ page }) => {
      await page.route('**/api/v1/resources', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to load resources'
          })
        });
      });

      await page.goto('/resources');

      const errorMessage = page.getByTestId('resources-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Unable to load resources');

      // Check retry button
      const retryButton = page.getByRole('button', { name: 'Try Again' });
      await expect(retryButton).toBeVisible();
    });

    test('handles download error', async ({ page }) => {
      await page.route('**/api/v1/resources/2/download', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'File not found'
          })
        });
      });

      await page.goto('/resources/2');

      const downloadButton = page.getByRole('button', { name: 'Download' });
      if (await downloadButton.isVisible()) {
        await downloadButton.click();

        const errorMessage = page.getByTestId('download-error');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('Download failed');
      }
    });
  });

  test.describe('Resource Accessibility', () => {
    test('supports keyboard navigation', async ({ page }) => {
      await page.goto('/resources');
      await waitForAPIResponse(page, '/api/v1/resources');

      // Tab through resource cards
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('has proper ARIA labels', async ({ page }) => {
      await page.goto('/resources/1');
      await waitForAPIResponse(page, '/api/v1/resources/1');

      // Check important elements have ARIA labels
      const accessButton = page.getByRole('button', { name: /Open|Download|View/i });
      if (await accessButton.isVisible()) {
        await expect(accessButton).toHaveAttribute('aria-label');
      }

      const bookmarkButton = page.getByRole('button', { name: /Bookmark/i });
      if (await bookmarkButton.isVisible()) {
        await expect(bookmarkButton).toHaveAttribute('aria-label');
      }
    });

    test('has proper heading structure', async ({ page }) => {
      await page.goto('/resources');

      // Check heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      
      const h2 = page.locator('h2');
      if (await h2.first().isVisible()) {
        await expect(h2.first()).toBeVisible();
      }
    });
  });
});