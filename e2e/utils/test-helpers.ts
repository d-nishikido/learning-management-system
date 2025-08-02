import { Page } from '@playwright/test';
import { testUsers } from '@fixtures/users';

export async function waitForAPIResponse(page: Page, url: string, status = 200) {
  return page.waitForResponse(
    response => response.url().includes(url) && response.status() === status
  );
}

export async function mockAPIResponse(page: Page, url: string, data: any, status = 200) {
  await page.route(url, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data)
    });
  });
}

export async function setupTestUser(page: Page, userType: keyof typeof testUsers) {
  const user = testUsers[userType];
  
  // Mock the authentication response
  await mockAPIResponse(page, '**/api/v1/auth/login', {
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 1,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    }
  });
}

export async function clearTestData() {
  // This would typically call an API to clear test data
  // For now, it's a placeholder
  console.log('Clearing test data...');
}

export function generateRandomEmail(): string {
  const timestamp = Date.now();
  return `test-${timestamp}@example.com`;
}

export function generateRandomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}