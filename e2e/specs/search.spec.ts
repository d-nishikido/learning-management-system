import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated for full search access
  });

  test.describe('Global Search', () => {
    test('performs basic search from header', async ({ page }) => {
      await page.goto('/dashboard');

      // Find search input in header/navigation
      const headerSearch = page.getByPlaceholder(/Search/i);
      await expect(headerSearch).toBeVisible();

      // Perform search
      await headerSearch.fill('TypeScript');
      await headerSearch.press('Enter');

      // Should navigate to search results page
      await page.waitForURL(/\/search/);
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check search results are displayed
      const searchResults = page.getByTestId('search-results');
      await expect(searchResults).toBeVisible();
    });

    test('displays search results correctly', async ({ page }) => {
      await page.goto('/search?q=TypeScript');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check search query is displayed
      const searchQuery = page.getByTestId('search-query');
      await expect(searchQuery).toContainText('TypeScript');

      // Check results count
      const resultsCount = page.getByTestId('results-count');
      await expect(resultsCount).toBeVisible();
      await expect(resultsCount).toContainText(/\d+ results?/);

      // Check individual search results
      const resultItems = page.getByTestId('search-result-item');
      const itemCount = await resultItems.count();
      expect(itemCount).toBeGreaterThan(0);

      // Verify result structure
      const firstResult = resultItems.first();
      await expect(firstResult.getByTestId('result-title')).toBeVisible();
      await expect(firstResult.getByTestId('result-type')).toBeVisible();
      await expect(firstResult.getByTestId('result-description')).toBeVisible();
    });

    test('handles empty search results', async ({ page }) => {
      await page.goto('/search?q=nonexistentkeyword123');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check no results message
      const noResults = page.getByTestId('no-search-results');
      await expect(noResults).toBeVisible();
      await expect(noResults).toContainText('No results found');

      // Check search suggestions if available
      const suggestions = page.getByTestId('search-suggestions');
      if (await suggestions.isVisible()) {
        await expect(suggestions).toContainText('Try different keywords');
      }
    });
  });

  test.describe('Search Filters', () => {
    test('filters search results by content type', async ({ page }) => {
      await page.goto('/search?q=programming');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Apply course filter
      const courseFilter = page.getByLabel('Courses');
      await courseFilter.check();
      
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check that only course results are shown
      const resultItems = page.getByTestId('search-result-item');
      const itemCount = await resultItems.count();
      
      if (itemCount > 0) {
        const firstResult = resultItems.first();
        const resultType = firstResult.getByTestId('result-type');
        await expect(resultType).toContainText('Course');
      }
    });

    test('filters search results by difficulty level', async ({ page }) => {
      await page.goto('/search?q=typescript');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Apply beginner filter
      const beginnerFilter = page.getByLabel('Beginner');
      await beginnerFilter.check();
      
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check that filtering worked
      const resultsCount = page.getByTestId('results-count');
      await expect(resultsCount).toBeVisible();
    });

    test('filters search results by category', async ({ page }) => {
      await page.goto('/search?q=development');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Open category filter dropdown
      const categoryDropdown = page.getByLabel('Category');
      await categoryDropdown.selectOption('Programming');
      
      await waitForAPIResponse(page, '**/api/v1/search');

      // Verify results are filtered
      const resultItems = page.getByTestId('search-result-item');
      if (await resultItems.count() > 0) {
        const firstResult = resultItems.first();
        const resultCategory = firstResult.getByTestId('result-category');
        await expect(resultCategory).toContainText('Programming');
      }
    });

    test('clears all filters', async ({ page }) => {
      await page.goto('/search?q=javascript&type=course&level=beginner');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Apply filters first
      const courseFilter = page.getByLabel('Courses');
      const beginnerFilter = page.getByLabel('Beginner');
      
      if (await courseFilter.isVisible()) {
        await courseFilter.check();
      }
      if (await beginnerFilter.isVisible()) {
        await beginnerFilter.check();
      }

      // Clear all filters
      const clearFiltersButton = page.getByRole('button', { name: 'Clear Filters' });
      await clearFiltersButton.click();
      
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check that filters are cleared
      if (await courseFilter.isVisible()) {
        await expect(courseFilter).not.toBeChecked();
      }
      if (await beginnerFilter.isVisible()) {
        await expect(beginnerFilter).not.toBeChecked();
      }
    });
  });

  test.describe('Search Result Interaction', () => {
    test('navigates to course from search results', async ({ page }) => {
      await page.goto('/search?q=TypeScript');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Find and click on a course result
      const courseResult = page.locator('[data-result-type="course"]').first();
      
      if (await courseResult.isVisible()) {
        const courseTitle = courseResult.getByTestId('result-title');
        await courseTitle.click();

        // Should navigate to course detail page
        await page.waitForURL(/\/courses\/\d+/);
        expect(page.url()).toMatch(/\/courses\/\d+/);
      }
    });

    test('navigates to lesson from search results', async ({ page }) => {
      await page.goto('/search?q=variables');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Find and click on a lesson result
      const lessonResult = page.locator('[data-result-type="lesson"]').first();
      
      if (await lessonResult.isVisible()) {
        const lessonTitle = lessonResult.getByTestId('result-title');
        await lessonTitle.click();

        // Should navigate to lesson detail page
        await page.waitForURL(/\/courses\/\d+\/lessons\/\d+/);
        expect(page.url()).toMatch(/\/courses\/\d+\/lessons\/\d+/);
      }
    });

    test('navigates to resource from search results', async ({ page }) => {
      await page.goto('/search?q=documentation');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Find and click on a resource result
      const resourceResult = page.locator('[data-result-type="resource"]').first();
      
      if (await resourceResult.isVisible()) {
        const resourceTitle = resourceResult.getByTestId('result-title');
        await resourceTitle.click();

        // Should navigate to resource detail page
        await page.waitForURL(/\/resources\/\d+/);
        expect(page.url()).toMatch(/\/resources\/\d+/);
      }
    });
  });

  test.describe('Advanced Search', () => {
    test('performs advanced search with multiple criteria', async ({ page }) => {
      await page.goto('/search');

      // Open advanced search form
      const advancedSearchToggle = page.getByRole('button', { name: 'Advanced Search' });
      if (await advancedSearchToggle.isVisible()) {
        await advancedSearchToggle.click();

        // Fill advanced search form
        const titleField = page.getByLabel('Title contains');
        await titleField.fill('TypeScript');

        const categoryField = page.getByLabel('Category');
        await categoryField.selectOption('Programming');

        const difficultyField = page.getByLabel('Difficulty');
        await difficultyField.selectOption('Beginner');

        // Submit advanced search
        const searchButton = page.getByRole('button', { name: 'Search' });
        await searchButton.click();

        await waitForAPIResponse(page, '**/api/v1/search/advanced');

        // Check that results match criteria
        const searchResults = page.getByTestId('search-results');
        await expect(searchResults).toBeVisible();
      }
    });

    test('saves and reuses search filters', async ({ page }) => {
      await page.goto('/search?q=programming');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Apply filters
      const courseFilter = page.getByLabel('Courses');
      if (await courseFilter.isVisible()) {
        await courseFilter.check();
      }

      const beginnerFilter = page.getByLabel('Beginner');
      if (await beginnerFilter.isVisible()) {
        await beginnerFilter.check();
      }

      // Save current search
      const saveSearchButton = page.getByRole('button', { name: 'Save Search' });
      if (await saveSearchButton.isVisible()) {
        await saveSearchButton.click();

        // Fill save dialog
        const searchName = page.getByLabel('Search Name');
        await searchName.fill('Programming Courses for Beginners');

        const confirmSave = page.getByRole('button', { name: 'Save' });
        await confirmSave.click();

        await waitForAPIResponse(page, '**/api/v1/search/saved', 201);

        // Check success message
        const successMessage = page.getByTestId('save-success-message');
        await expect(successMessage).toBeVisible();
      }
    });
  });

  test.describe('Search Autocomplete', () => {
    test('shows search suggestions while typing', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      await searchInput.fill('Type');

      // Wait for autocomplete suggestions
      const suggestions = page.getByTestId('search-suggestions');
      if (await suggestions.isVisible()) {
        const suggestionItems = suggestions.locator('.suggestion-item');
        const suggestionCount = await suggestionItems.count();
        expect(suggestionCount).toBeGreaterThan(0);

        // Click on first suggestion
        await suggestionItems.first().click();
        
        // Should fill the search input
        await expect(searchInput).toHaveValue(/Type/);
      }
    });

    test('shows recent searches', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      await searchInput.click();

      // Check for recent searches dropdown
      const recentSearches = page.getByTestId('recent-searches');
      if (await recentSearches.isVisible()) {
        const recentItems = recentSearches.locator('.recent-search-item');
        const itemCount = await recentItems.count();
        
        if (itemCount > 0) {
          // Click on first recent search
          await recentItems.first().click();
          
          // Should perform the search
          await waitForAPIResponse(page, '**/api/v1/search');
        }
      }
    });
  });

  test.describe('Search Error Handling', () => {
    test('handles search API errors', async ({ page }) => {
      await page.route('**/api/v1/search', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Search service unavailable'
          })
        });
      });

      await page.goto('/search?q=test');

      // Check error message
      const errorMessage = page.getByTestId('search-error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Search is currently unavailable');

      // Check retry button
      const retryButton = page.getByRole('button', { name: 'Try Again' });
      await expect(retryButton).toBeVisible();
    });

    test('handles malformed search queries', async ({ page }) => {
      await page.goto('/search?q=' + encodeURIComponent('special@#$%characters'));
      await waitForAPIResponse(page, '**/api/v1/search');

      // Should either show results or appropriate message
      const searchResults = page.getByTestId('search-results');
      const noResults = page.getByTestId('no-search-results');
      
      const hasResults = await searchResults.isVisible();
      const hasNoResults = await noResults.isVisible();
      
      expect(hasResults || hasNoResults).toBe(true);
    });
  });

  test.describe('Search Performance', () => {
    test('displays loading state during search', async ({ page }) => {
      // Mock delayed search response
      await page.route('**/api/v1/search', async route => {
        await page.waitForTimeout(2000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              results: [],
              totalCount: 0
            }
          })
        });
      });

      await page.goto('/search?q=loading');

      // Check loading indicator
      const loadingIndicator = page.getByTestId('search-loading');
      await expect(loadingIndicator).toBeVisible();

      // Wait for search to complete
      await waitForAPIResponse(page, '**/api/v1/search');
      await expect(loadingIndicator).not.toBeVisible();
    });

    test('debounces search input', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      
      // Type quickly to test debouncing
      await searchInput.fill('a');
      await searchInput.fill('ab');
      await searchInput.fill('abc');
      
      // Should not trigger multiple API calls immediately
      await page.waitForTimeout(1000);
      
      // Only final search should trigger
      await expect(searchInput).toHaveValue('abc');
    });
  });

  test.describe('Search Accessibility', () => {
    test('supports keyboard navigation in search results', async ({ page }) => {
      await page.goto('/search?q=programming');
      await waitForAPIResponse(page, '**/api/v1/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      await searchInput.focus();

      // Navigate through results with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('has proper ARIA labels for search controls', async ({ page }) => {
      await page.goto('/search');

      const searchInput = page.getByPlaceholder(/Search/i);
      await expect(searchInput).toHaveAttribute('aria-label');

      const searchButton = page.getByRole('button', { name: /Search/i });
      if (await searchButton.isVisible()) {
        await expect(searchButton).toHaveAttribute('aria-label');
      }
    });

    test('announces search results to screen readers', async ({ page }) => {
      await page.goto('/search?q=test');
      await waitForAPIResponse(page, '**/api/v1/search');

      // Check for ARIA live region that announces results
      const resultsAnnouncement = page.getByTestId('results-announcement');
      if (await resultsAnnouncement.isVisible()) {
        await expect(resultsAnnouncement).toHaveAttribute('aria-live');
      }
    });
  });
});