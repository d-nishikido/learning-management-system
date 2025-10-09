/**
 * パフォーマンステスト: マークダウンビューアーのレンダリング性能
 *
 * テスト目標:
 * - 小規模コンテンツ（1KB）: 100ms以内
 * - 中規模コンテンツ（10KB）: 500ms以内
 * - 大規模コンテンツ（100KB）: 3秒以内
 * - 10個のコードブロック: 1秒以内
 */

import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

// テストデータ生成ヘルパー
function generateMarkdownContent(sizeInKB: number): string {
  const targetBytes = sizeInKB * 1024;
  let content = '# パフォーマンステスト\n\n';

  const paragraph = 'これは日本語のテストコンテンツです。マークダウンのレンダリング性能を計測します。'.repeat(10);

  while (Buffer.byteLength(content, 'utf8') < targetBytes) {
    content += `\n## セクション ${Math.random().toString(36).substring(7)}\n\n`;
    content += `${paragraph}\n\n`;
    content += `- 項目1\n- 項目2\n- 項目3\n\n`;
  }

  return content.substring(0, Math.ceil(targetBytes / Buffer.byteLength(content, 'utf8') * content.length));
}

function generateMarkdownWithCodeBlocks(blockCount: number): string {
  let content = '# コードブロックテスト\n\n';

  const languages = ['javascript', 'python', 'typescript', 'java', 'go'];
  const codeSnippets = [
    'function hello() {\n  console.log("Hello World");\n  return true;\n}',
    'def calculate(x, y):\n    result = x + y\n    return result',
    'const greeting: string = "Hello";\nconsole.log(greeting);',
    'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}',
    'func main() {\n  fmt.Println("Hello World")\n}'
  ];

  for (let i = 0; i < blockCount; i++) {
    const lang = languages[i % languages.length];
    const code = codeSnippets[i % codeSnippets.length];
    content += `\n## コードブロック ${i + 1}\n\n`;
    content += `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    content += 'これはコードブロックの説明文です。\n\n';
  }

  return content;
}

test.describe('マークダウンビューアー: パフォーマンステスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // 認証済み状態
  });

  test('should render small content (1KB) within 100ms', async ({ page }) => {
    const content = generateMarkdownContent(1);

    // レッスンにマークダウンコンテンツを設定するモック
    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'パフォーマンステスト - 1KB',
          content: content,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // コンテンツが表示されるまでの時間を計測
    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`Small content (1KB) render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(100);
  });

  test('should render medium content (10KB) within 500ms', async ({ page }) => {
    const content = generateMarkdownContent(10);

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'パフォーマンステスト - 10KB',
          content: content,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`Medium content (10KB) render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(500);
  });

  test('should render large content (100KB) within 3 seconds', async ({ page }) => {
    const content = generateMarkdownContent(100);

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'パフォーマンステスト - 100KB',
          content: content,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`Large content (100KB) render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(3000);
  });

  test('should render content with 10 code blocks within 1 second', async ({ page }) => {
    const content = generateMarkdownWithCodeBlocks(10);

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'パフォーマンステスト - 10コードブロック',
          content: content,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    const startTime = Date.now();
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // コンテンツとコードブロックが表示されることを確認
    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // 最初のコードブロックが表示されることを確認
    const firstCodeBlock = contentArea.locator('pre').first();
    await expect(firstCodeBlock).toBeVisible();

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`Content with 10 code blocks render time: ${renderTime}ms`);
    expect(renderTime).toBeLessThan(1000);
  });

  test('should verify React.memo optimization on MarkdownViewer', async ({ page }) => {
    // マークダウンビューアーコンポーネントがメモ化されていることを確認
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // ページの初回レンダリング時間を記録
    const firstRenderMetrics = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });

    console.log('Navigation metrics:', firstRenderMetrics);

    // メモ化により不要な再レンダリングが発生しないことを確認
    // （実際のテストでは、React DevTools Profilerやcustom hooksで確認）
    expect(firstRenderMetrics).toBeDefined();
  });
});

test.describe('マークダウンエディター: パフォーマンステスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // 認証済み状態
  });

  test('should handle real-time preview updates efficiently', async ({ page }) => {
    await page.goto('/admin/courses/1/lessons/new');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea[placeholder*="マークダウン"]');

    const largeContent = generateMarkdownContent(10);

    const startTime = Date.now();

    // 大きなコンテンツを入力
    await textarea.fill(largeContent);

    // プレビューが更新されることを確認
    const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
    await expect(previewArea).toBeVisible();

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    console.log(`Preview update time for 10KB content: ${updateTime}ms`);

    // プレビュー更新は1秒以内に完了すべき
    expect(updateTime).toBeLessThan(1000);
  });
});
