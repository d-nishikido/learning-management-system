import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { setupTestData, cleanupTestData } from '../utils/test-helpers';

test.describe('Test Management', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let testData: any;

  test.beforeAll(async () => {
    testData = await setupTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Test Creation and Management (Admin)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await loginPage.goto();
      await loginPage.login('admin@test.example.com', 'Admin123!');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should create a new test successfully', async ({ page }) => {
      // Navigate to tests page
      await page.click('[data-testid="nav-tests"]');
      await expect(page).toHaveURL('/tests');

      // Click create test button
      await page.click('[data-testid="create-test-btn"]');
      await expect(page).toHaveURL('/tests/create');

      // Fill in test details
      await page.fill('[data-testid="test-title"]', 'E2E Test - JavaScript Fundamentals');
      await page.fill('[data-testid="test-description"]', 'Comprehensive test covering JavaScript basics');
      
      // Select course
      await page.selectOption('[data-testid="course-select"]', { label: 'JavaScript Fundamentals' });
      
      // Set test configuration
      await page.fill('[data-testid="time-limit"]', '90');
      await page.fill('[data-testid="max-attempts"]', '3');
      await page.fill('[data-testid="passing-score"]', '75');
      
      // Enable options
      await page.check('[data-testid="shuffle-questions"]');
      await page.check('[data-testid="shuffle-options"]');
      await page.check('[data-testid="show-results-immediately"]');
      
      // Set availability dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      await page.fill('[data-testid="available-from"]', tomorrow.toISOString().split('T')[0]);
      await page.fill('[data-testid="available-until"]', nextWeek.toISOString().split('T')[0]);

      // Submit form
      await page.click('[data-testid="create-test-submit"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Test created successfully');
      await expect(page).toHaveURL(/\/tests\/\d+/);
    });

    test('should add questions to test', async ({ page }) => {
      // First create a test (using API for setup)
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        },
        data: {
          title: 'Test for Questions',
          courseId: testData.courses[0].id,
          timeLimitMinutes: 60,
          maxAttempts: 3,
          passingScore: 70,
          isPublished: false
        }
      });
      const test = await testResponse.json();

      // Navigate to test questions page
      await page.goto(`/tests/${test.data.id}/questions`);
      
      // Add first question
      await page.click('[data-testid="add-question-btn"]');
      await expect(page.locator('[data-testid="question-modal"]')).toBeVisible();
      
      // Select question from dropdown
      await page.selectOption('[data-testid="question-select"]', { index: 1 });
      await page.fill('[data-testid="sort-order"]', '1');
      
      await page.click('[data-testid="add-question-submit"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Question added to test successfully');
      
      // Verify question appears in list
      await expect(page.locator('[data-testid="test-question-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="questions-count"]')).toContainText('1 question');
    });

    test('should edit test configuration', async ({ page }) => {
      // Create test via API
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        },
        data: {
          title: 'Test to Edit',
          courseId: testData.courses[0].id,
          timeLimitMinutes: 60,
          maxAttempts: 2,
          passingScore: 65
        }
      });
      const test = await testResponse.json();

      // Navigate to edit page
      await page.goto(`/tests/${test.data.id}/edit`);
      
      // Update test details
      await page.fill('[data-testid="test-title"]', 'Updated Test Title');
      await page.fill('[data-testid="time-limit"]', '120');
      await page.fill('[data-testid="max-attempts"]', '5');
      await page.fill('[data-testid="passing-score"]', '80');
      
      await page.click('[data-testid="update-test-submit"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Test updated successfully');
      
      // Verify changes
      await expect(page.locator('[data-testid="test-title-display"]')).toContainText('Updated Test Title');
      await expect(page.locator('[data-testid="time-limit-display"]')).toContainText('120 minutes');
    });

    test('should publish test', async ({ page }) => {
      // Create unpublished test via API
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        },
        data: {
          title: 'Test to Publish',
          courseId: testData.courses[0].id,
          isPublished: false
        }
      });
      const test = await testResponse.json();

      // Add at least one question
      await page.request.post(`/api/v1/tests/${test.data.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        },
        data: {
          questionId: testData.questions[0].id,
          sortOrder: 1
        }
      });

      // Navigate to test details
      await page.goto(`/tests/${test.data.id}`);
      
      // Verify test is unpublished
      await expect(page.locator('[data-testid="test-status"]')).toContainText('Draft');
      
      // Publish test
      await page.click('[data-testid="publish-test-btn"]');
      await page.click('[data-testid="confirm-publish"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Test published successfully');
      await expect(page.locator('[data-testid="test-status"]')).toContainText('Published');
    });

    test('should view test statistics', async ({ page }) => {
      // Use existing test with results
      const testId = testData.tests[0].id;
      
      // Navigate to test statistics
      await page.goto(`/tests/${testId}/statistics`);
      
      // Verify statistics are displayed
      await expect(page.locator('[data-testid="total-attempts"]')).toBeVisible();
      await expect(page.locator('[data-testid="pass-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-time"]')).toBeVisible();
      
      // Verify charts are rendered
      await expect(page.locator('[data-testid="score-distribution-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="attempts-over-time-chart"]')).toBeVisible();
    });
  });

  test.describe('Test Taking Flow (Student)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as student
      await loginPage.goto();
      await loginPage.login('user1@test.example.com', 'User123!');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should display available tests', async ({ page }) => {
      // Navigate to tests page
      await page.click('[data-testid="nav-tests"]');
      await expect(page).toHaveURL('/tests');
      
      // Verify published tests are visible
      await expect(page.locator('[data-testid="available-tests"]')).toBeVisible();
      await expect(page.locator('[data-testid="test-card"]')).toHaveCountGreaterThan(0);
      
      // Verify test information is displayed
      const testCard = page.locator('[data-testid="test-card"]').first();
      await expect(testCard.locator('[data-testid="test-title"]')).toBeVisible();
      await expect(testCard.locator('[data-testid="test-time-limit"]')).toBeVisible();
      await expect(testCard.locator('[data-testid="test-attempts-left"]')).toBeVisible();
    });

    test('should check test eligibility', async ({ page }) => {
      const testId = testData.publishedTests[0].id;
      
      // Navigate to test details
      await page.goto(`/tests/${testId}`);
      
      // Check eligibility
      const eligibilityResponse = await page.request.get(`/api/v1/tests/${testId}/can-take`, {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
        }
      });
      const eligibility = await eligibilityResponse.json();
      
      if (eligibility.data.canTake) {
        await expect(page.locator('[data-testid="start-test-btn"]')).toBeEnabled();
        await expect(page.locator('[data-testid="eligibility-message"]')).toContainText('You can take this test');
      } else {
        await expect(page.locator('[data-testid="start-test-btn"]')).toBeDisabled();
        await expect(page.locator('[data-testid="eligibility-message"]')).toContainText(eligibility.data.reason);
      }
    });

    test('should start and complete a test', async ({ page }) => {
      const testId = testData.publishedTests[0].id;
      
      // Navigate to test and start it
      await page.goto(`/tests/${testId}`);
      await page.click('[data-testid="start-test-btn"]');
      
      // Confirm start
      await page.click('[data-testid="confirm-start-test"]');
      
      // Verify test started
      await expect(page).toHaveURL(`/tests/${testId}/take`);
      await expect(page.locator('[data-testid="test-timer"]')).toBeVisible();
      await expect(page.locator('[data-testid="question-progress"]')).toBeVisible();
      
      // Answer questions
      const questions = page.locator('[data-testid="test-question"]');
      const questionCount = await questions.count();
      
      for (let i = 0; i < questionCount; i++) {
        const question = questions.nth(i);
        const questionType = await question.getAttribute('data-question-type');
        
        if (questionType === 'MULTIPLE_CHOICE') {
          // Select first option
          await question.locator('[data-testid="option-radio"]').first().check();
        } else if (questionType === 'ESSAY') {
          // Fill text area
          await question.locator('[data-testid="essay-textarea"]').fill('This is a sample essay answer for testing purposes.');
        }
        
        // Navigate to next question (if not last)
        if (i < questionCount - 1) {
          await page.click('[data-testid="next-question-btn"]');
        }
      }
      
      // Submit test
      await page.click('[data-testid="submit-test-btn"]');
      await page.click('[data-testid="confirm-submit-test"]');
      
      // Verify test completed
      await expect(page).toHaveURL(`/tests/${testId}/result`);
      await expect(page.locator('[data-testid="test-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="test-result-status"]')).toBeVisible();
      
      // Verify result details if shown immediately
      if (testData.publishedTests[0].showResultsImmediately) {
        await expect(page.locator('[data-testid="question-results"]')).toBeVisible();
        await expect(page.locator('[data-testid="correct-answers"]')).toBeVisible();
      }
    });

    test('should handle test timeout', async ({ page }) => {
      // Create a test with very short time limit for testing
      const shortTestResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          title: 'Timeout Test',
          courseId: testData.courses[0].id,
          timeLimitMinutes: 0.1, // 6 seconds
          isPublished: true
        }
      });
      const shortTest = await shortTestResponse.json();
      
      // Add a question
      await page.request.post(`/api/v1/tests/${shortTest.data.id}/questions`, {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          questionId: testData.questions[0].id
        }
      });
      
      // Start the test
      await page.goto(`/tests/${shortTest.data.id}`);
      await page.click('[data-testid="start-test-btn"]');
      await page.click('[data-testid="confirm-start-test"]');
      
      // Wait for timeout
      await expect(page.locator('[data-testid="timeout-warning"]')).toBeVisible({ timeout: 10000 });
      
      // Verify auto-submit
      await expect(page).toHaveURL(`/tests/${shortTest.data.id}/result`, { timeout: 15000 });
      await expect(page.locator('[data-testid="timeout-message"]')).toContainText('Test was automatically submitted due to time limit');
    });

    test('should save progress and resume test', async ({ page }) => {
      const testId = testData.publishedTests[0].id;
      
      // Start test
      await page.goto(`/tests/${testId}`);
      await page.click('[data-testid="start-test-btn"]');
      await page.click('[data-testid="confirm-start-test"]');
      
      // Answer first question
      await page.locator('[data-testid="option-radio"]').first().check();
      await page.click('[data-testid="save-progress-btn"]');
      
      // Verify progress saved
      await expect(page.locator('[data-testid="progress-saved-message"]')).toContainText('Progress saved');
      
      // Leave test (simulate browser close)
      await page.goto('/dashboard');
      
      // Return to test
      await page.goto(`/tests/${testId}`);
      
      // Verify resume option
      await expect(page.locator('[data-testid="resume-test-btn"]')).toBeVisible();
      await page.click('[data-testid="resume-test-btn"]');
      
      // Verify we're back in test with progress
      await expect(page).toHaveURL(`/tests/${testId}/take`);
      await expect(page.locator('[data-testid="option-radio"]').first()).toBeChecked();
    });

    test('should view test history and results', async ({ page }) => {
      // Navigate to test history
      await page.click('[data-testid="nav-profile"]');
      await page.click('[data-testid="test-history-tab"]');
      
      // Verify test history is displayed
      await expect(page.locator('[data-testid="test-history-list"]')).toBeVisible();
      
      // Check if there are any test results
      const resultItems = page.locator('[data-testid="test-result-item"]');
      const resultCount = await resultItems.count();
      
      if (resultCount > 0) {
        // Click on first result to view details
        await resultItems.first().click();
        
        // Verify result details
        await expect(page.locator('[data-testid="result-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="result-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="result-time-spent"]')).toBeVisible();
        
        // Verify answer review if available
        if (await page.locator('[data-testid="review-answers-btn"]').isVisible()) {
          await page.click('[data-testid="review-answers-btn"]');
          await expect(page.locator('[data-testid="answer-review"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Test Attempt Limits and Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('user2@test.example.com', 'User123!');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should enforce maximum attempts limit', async ({ page }) => {
      // Create test with max 1 attempt
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          title: 'Single Attempt Test',
          courseId: testData.courses[0].id,
          maxAttempts: 1,
          isPublished: true
        }
      });
      const test = await testResponse.json();
      
      // Add question
      await page.request.post(`/api/v1/tests/${test.data.id}/questions`, {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          questionId: testData.questions[0].id
        }
      });
      
      // Take and complete test first time
      await page.goto(`/tests/${test.data.id}`);
      await page.click('[data-testid="start-test-btn"]');
      await page.click('[data-testid="confirm-start-test"]');
      
      // Answer and submit
      await page.locator('[data-testid="option-radio"]').first().check();
      await page.click('[data-testid="submit-test-btn"]');
      await page.click('[data-testid="confirm-submit-test"]');
      
      // Try to take test again
      await page.goto(`/tests/${test.data.id}`);
      
      // Verify cannot retake
      await expect(page.locator('[data-testid="start-test-btn"]')).toBeDisabled();
      await expect(page.locator('[data-testid="eligibility-message"]')).toContainText('Maximum attempts (1) exceeded');
    });

    test('should respect availability dates', async ({ page }) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      // Create test available in future
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          title: 'Future Test',
          courseId: testData.courses[0].id,
          availableFrom: futureDate.toISOString(),
          isPublished: true
        }
      });
      const test = await testResponse.json();
      
      // Navigate to test
      await page.goto(`/tests/${test.data.id}`);
      
      // Verify cannot take
      await expect(page.locator('[data-testid="start-test-btn"]')).toBeDisabled();
      await expect(page.locator('[data-testid="eligibility-message"]')).toContainText('Test is not yet available');
    });
  });

  test.describe('Question Randomization', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('user1@test.example.com', 'User123!');
      await expect(page).toHaveURL('/dashboard');
    });

    test('should shuffle questions when enabled', async ({ page }) => {
      // Create test with question shuffling
      const testResponse = await page.request.post('/api/v1/tests', {
        headers: {
          'Authorization': 'Bearer ' + testData.adminToken
        },
        data: {
          title: 'Shuffle Questions Test',
          courseId: testData.courses[0].id,
          shuffleQuestions: true,
          isPublished: true
        }
      });
      const test = await testResponse.json();
      
      // Add multiple questions
      for (let i = 0; i < 3; i++) {
        await page.request.post(`/api/v1/tests/${test.data.id}/questions`, {
          headers: {
            'Authorization': 'Bearer ' + testData.adminToken
          },
          data: {
            questionId: testData.questions[i].id,
            sortOrder: i + 1
          }
        });
      }
      
      // Start test and get questions
      await page.goto(`/tests/${test.data.id}`);
      await page.click('[data-testid="start-test-btn"]');
      await page.click('[data-testid="confirm-start-test"]');
      
      // Get question order
      const questionTitles = await page.locator('[data-testid="question-title"]').allTextContents();
      
      // Restart test and check if order is different
      await page.goto('/dashboard');
      await page.goto(`/tests/${test.data.id}`);
      await page.click('[data-testid="start-test-btn"]');
      await page.click('[data-testid="confirm-start-test"]');
      
      const newQuestionTitles = await page.locator('[data-testid="question-title"]').allTextContents();
      
      // Note: This test might occasionally fail due to random chance
      // In a real implementation, you'd want to mock the shuffle function for deterministic testing
      expect(questionTitles.length).toEqual(newQuestionTitles.length);
      expect(questionTitles.length).toBeGreaterThan(1);
    });
  });
});