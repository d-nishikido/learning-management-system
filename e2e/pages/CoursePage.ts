import { Page, Locator } from '@playwright/test';

export class CoursePage {
  readonly page: Page;
  readonly courseTitle: Locator;
  readonly courseDescription: Locator;
  readonly enrollButton: Locator;
  readonly lessonsList: Locator;
  readonly progressBar: Locator;
  readonly createCourseButton: Locator;
  readonly editCourseButton: Locator;
  readonly deleteCourseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.courseTitle = page.getByTestId('course-title');
    this.courseDescription = page.getByTestId('course-description');
    this.enrollButton = page.getByRole('button', { name: 'Enroll' });
    this.lessonsList = page.getByTestId('lessons-list');
    this.progressBar = page.getByRole('progressbar');
    this.createCourseButton = page.getByRole('button', { name: 'Create Course' });
    this.editCourseButton = page.getByRole('button', { name: 'Edit' });
    this.deleteCourseButton = page.getByRole('button', { name: 'Delete' });
  }

  async goto(courseId?: number) {
    if (courseId) {
      await this.page.goto(`/courses/${courseId}`);
    } else {
      await this.page.goto('/courses');
    }
  }

  async enrollInCourse() {
    await this.enrollButton.click();
  }

  async createCourse(title: string, description: string, level: string) {
    await this.createCourseButton.click();
    await this.page.getByLabel('Title').fill(title);
    await this.page.getByLabel('Description').fill(description);
    await this.page.getByLabel('Level').selectOption(level);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async getCourseProgress(): Promise<string> {
    return await this.progressBar.getAttribute('aria-valuenow') || '0';
  }
}