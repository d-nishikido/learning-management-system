import { test, expect } from '@fixtures/auth';
import { CoursePage } from '@pages/CoursePage';
import { testCourses } from '@fixtures/courses';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Course Management', () => {
  let coursePage: CoursePage;

  test.beforeEach(async ({ page, authenticatedPage }) => {
    coursePage = new CoursePage(page);
  });

  test.describe('Course Listing', () => {
    test('display all published courses', async ({ page }) => {
      await coursePage.goto();
      
      // Wait for courses to load
      await waitForAPIResponse(page, '/api/v1/courses');

      // Check course cards are displayed
      const courseCards = page.getByTestId('course-card');
      await expect(courseCards).toHaveCount(2); // Two published courses in seed data

      // Verify course information
      await expect(page.getByText('Introduction to TypeScript')).toBeVisible();
      await expect(page.getByText('Advanced React Patterns')).toBeVisible();
      
      // Unpublished course should not be visible
      await expect(page.getByText('Node.js Backend Development')).not.toBeVisible();
    });

    test('filter courses by category', async ({ page }) => {
      await coursePage.goto();

      // Select Programming category
      await page.getByLabel('Category').selectOption('Programming');
      await waitForAPIResponse(page, '/api/v1/courses');

      // Should show only programming courses
      await expect(page.getByText('Introduction to TypeScript')).toBeVisible();
      await expect(page.getByText('Advanced React Patterns')).not.toBeVisible();
    });

    test('search courses', async ({ page }) => {
      await coursePage.goto();

      // Search for "TypeScript"
      await page.getByPlaceholder('Search courses...').fill('TypeScript');
      await page.getByPlaceholder('Search courses...').press('Enter');
      
      await waitForAPIResponse(page, '/api/v1/courses');

      // Should show only matching course
      await expect(page.getByText('Introduction to TypeScript')).toBeVisible();
      await expect(page.getByText('Advanced React Patterns')).not.toBeVisible();
    });
  });

  test.describe('Course Details', () => {
    test('view course details and lessons', async ({ page }) => {
      await coursePage.goto(1); // TypeScript course

      // Verify course information
      await expect(coursePage.courseTitle).toHaveText('Introduction to TypeScript');
      await expect(coursePage.courseDescription).toBeVisible();

      // Check lessons list
      const lessons = coursePage.lessonsList.locator('.lesson-item');
      await expect(lessons).toHaveCount(3);
      
      // Verify lesson titles
      await expect(lessons.nth(0)).toContainText('Getting Started with TypeScript');
      await expect(lessons.nth(1)).toContainText('TypeScript Types');
      await expect(lessons.nth(2)).toContainText('Interfaces and Classes');
    });
  });

  test.describe('Course Enrollment', () => {
    test('enroll in course from listing page', async ({ page, authenticatedPage }) => {
      // Navigate to courses page
      await page.goto('/courses');
      await waitForAPIResponse(page, '/api/v1/courses');

      // Wait for enrolled courses to load
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Find the first course card with an enroll button
      const enrollButton = page.getByRole('button', { name: /今すぐ登録|Enroll Now/i }).first();
      await expect(enrollButton).toBeVisible();

      // Click enroll
      await enrollButton.click();
      
      // Wait for enrollment API
      const enrollResponse = await waitForAPIResponse(page, '**/api/v1/courses/**/enroll', 201);
      expect(enrollResponse.ok()).toBeTruthy();

      // Button should change to unenroll
      await expect(page.getByRole('button', { name: /登録解除|Unenroll/i }).first()).toBeVisible();
    });

    test('enroll in course from detail page', async ({ page, authenticatedPage }) => {
      // Navigate to course detail page
      await page.goto('/courses/1');
      await waitForAPIResponse(page, '/api/v1/courses/1');

      // Wait for enrollment status check
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Find enroll button
      const enrollButton = page.getByRole('button', { name: /コースに登録|Enroll in Course/i });
      await expect(enrollButton).toBeVisible();

      // Click enroll
      await enrollButton.click();
      
      // Wait for enrollment API
      const enrollResponse = await waitForAPIResponse(page, '/api/v1/courses/1/enroll', 201);
      expect(enrollResponse.ok()).toBeTruthy();

      // Button should change to unenroll
      await expect(page.getByRole('button', { name: /コース登録解除|Unenroll from Course/i })).toBeVisible();
    });

    test('unenroll from course', async ({ page, authenticatedPage }) => {
      // First enroll in a course
      await page.goto('/courses/1');
      await waitForAPIResponse(page, '/api/v1/courses/1');
      await waitForAPIResponse(page, '/api/v1/users/me/enrolled-courses');

      // Enroll if not already enrolled
      const enrollButton = page.getByRole('button', { name: /コースに登録|Enroll in Course/i });
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
        await waitForAPIResponse(page, '/api/v1/courses/1/enroll', 201);
      }

      // Now unenroll
      const unenrollButton = page.getByRole('button', { name: /コース登録解除|Unenroll from Course/i });
      await expect(unenrollButton).toBeVisible();
      await unenrollButton.click();

      // Wait for unenrollment API
      const unenrollResponse = await waitForAPIResponse(page, '/api/v1/courses/1/enroll', 200);
      expect(unenrollResponse.ok()).toBeTruthy();

      // Button should change back to enroll
      await expect(page.getByRole('button', { name: /コースに登録|Enroll in Course/i })).toBeVisible();
    });

    test('show error message on enrollment failure', async ({ page, authenticatedPage }) => {
      // Mock enrollment failure
      await page.route('**/api/v1/courses/1/enroll', async route => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'User is already enrolled in this course'
          })
        });
      });

      await page.goto('/courses/1');
      await waitForAPIResponse(page, '/api/v1/courses/1');

      // Try to enroll
      const enrollButton = page.getByRole('button', { name: /コースに登録|Enroll in Course/i });
      await enrollButton.click();

      // Should show error message
      await expect(page.getByText(/登録に失敗しました|Failed to enroll/i)).toBeVisible();
    });
  });

  test.describe('Admin Course Management', () => {
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

    test('create new course', async ({ page }) => {
      await coursePage.goto();

      // Admin should see create button
      await expect(coursePage.createCourseButton).toBeVisible();

      // Create new course
      await coursePage.createCourse(
        'Docker Fundamentals',
        'Learn containerization with Docker',
        'BEGINNER'
      );

      await waitForAPIResponse(page, '/api/v1/courses', 201);

      // Should redirect to course details
      expect(page.url()).toMatch(/\/courses\/\d+/);
      await expect(page.getByText('Docker Fundamentals')).toBeVisible();
    });

    test('edit existing course', async ({ page }) => {
      await coursePage.goto(1);

      // Admin should see edit button
      await expect(coursePage.editCourseButton).toBeVisible();
      await coursePage.editCourseButton.click();

      // Should navigate to edit page
      await page.waitForURL('/courses/1/edit');

      // Update course title
      await page.getByLabel('Title').clear();
      await page.getByLabel('Title').fill('TypeScript Mastery');
      await page.getByRole('button', { name: 'Save Changes' }).click();

      await waitForAPIResponse(page, '/api/v1/courses/1');

      // Should show updated title
      await expect(coursePage.courseTitle).toHaveText('TypeScript Mastery');
    });

    test('delete course', async ({ page }) => {
      await coursePage.goto(3); // Unpublished course

      // Admin should see delete button
      await expect(coursePage.deleteCourseButton).toBeVisible();
      await coursePage.deleteCourseButton.click();

      // Confirm deletion
      await page.getByRole('button', { name: 'Confirm Delete' }).click();
      await waitForAPIResponse(page, '/api/v1/courses/3', 204);

      // Should redirect to courses list
      await page.waitForURL('/courses');
      
      // Course should not be in the list
      await expect(page.getByText('Node.js Backend Development')).not.toBeVisible();
    });
  });

  test.describe('Course Progress', () => {
    test.beforeEach(async ({ page }) => {
      // Mock enrolled user
      await page.route('**/api/v1/courses/1/enrollment', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            enrolled: true,
            enrolledAt: new Date().toISOString(),
            progress: 33
          })
        });
      });
    });

    test('track lesson completion', async ({ page }) => {
      await coursePage.goto(1);

      // Should show progress bar
      await expect(coursePage.progressBar).toBeVisible();
      expect(await coursePage.getCourseProgress()).toBe('33');

      // Complete a lesson
      const firstLesson = coursePage.lessonsList.locator('.lesson-item').first();
      await firstLesson.getByRole('button', { name: 'Start Lesson' }).click();

      // Should navigate to lesson page
      await page.waitForURL('/courses/1/lessons/1');

      // Mark as complete
      await page.getByRole('button', { name: 'Mark as Complete' }).click();
      await waitForAPIResponse(page, '/api/v1/lessons/1/complete');

      // Navigate back to course
      await coursePage.goto(1);

      // Progress should be updated
      expect(await coursePage.getCourseProgress()).toBe('66');
    });
  });
});