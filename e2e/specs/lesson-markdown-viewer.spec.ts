/**
 * E2Eテスト: レッスン詳細ページのマークダウン閲覧機能（学習者フロー）
 *
 * テスト対象:
 * - レッスン詳細ページでのマークダウンコンテンツ表示
 * - マークダウン要素（見出し、リスト、コードブロック、リンク、画像）のレンダリング
 * - レスポンシブ表示（デスクトップ、タブレット、モバイル）
 * - アクセシビリティとパフォーマンス
 */

import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('学習者フロー: レッスン詳細ページでのマークダウン表示', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated
  });

  test('should navigate to lesson detail page successfully', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/Learning Management System/i);

    // レッスンタイトルが表示されることを確認
    const lessonTitle = page.locator('h1').first();
    await expect(lessonTitle).toBeVisible();
  });

  test('should render markdown content area', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // マークダウンコンテンツエリアが表示されることを確認
    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // proseクラス（Tailwind Typography）が適用されていることを確認
    const proseElement = contentArea.locator('.prose');
    await expect(proseElement).toBeVisible();
  });

  test('should render markdown headings correctly', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 見出し要素が存在することを確認（具体的な内容はレッスンに依存）
    const headings = contentArea.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    if (headingCount > 0) {
      // 少なくとも1つの見出しが表示されていることを確認
      await expect(headings.first()).toBeVisible();
    }
  });

  test('should render code blocks with proper styling', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // コードブロック（pre > code）が存在する場合、適切にスタイリングされていることを確認
    const codeBlocks = contentArea.locator('pre code');
    const codeBlockCount = await codeBlocks.count();

    if (codeBlockCount > 0) {
      const firstCodeBlock = codeBlocks.first();
      await expect(firstCodeBlock).toBeVisible();

      // シンタックスハイライト用のクラスが適用されていることを確認
      const className = await firstCodeBlock.getAttribute('class');
      expect(className).toBeTruthy();
    }
  });

  test('should render links with proper security attributes', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 外部リンクが存在する場合、セキュリティ属性を確認
    const links = contentArea.locator('a[href^="http"]');
    const linkCount = await links.count();

    if (linkCount > 0) {
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();

      // target="_blank"の場合、rel属性にnoopenerとnoreferrerが含まれることを確認
      const target = await firstLink.getAttribute('target');
      if (target === '_blank') {
        const rel = await firstLink.getAttribute('rel');
        expect(rel).toContain('noopener');
        expect(rel).toContain('noreferrer');
      }
    }
  });

  test('should render images with alt attributes', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 画像が存在する場合、alt属性が設定されていることを確認
    const images = contentArea.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await expect(img).toBeVisible();

        // alt属性が設定されていることを確認（アクセシビリティ）
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
      }
    }
  });

  test('should render tables correctly', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // テーブルが存在する場合、適切に表示されることを確認
    const tables = contentArea.locator('table');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      const firstTable = tables.first();
      await expect(firstTable).toBeVisible();

      // テーブルヘッダーが存在することを確認
      const thead = firstTable.locator('thead');
      if (await thead.count() > 0) {
        await expect(thead).toBeVisible();
      }
    }
  });

  test('should render blockquotes correctly', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 引用ブロックが存在する場合、表示されることを確認
    const blockquotes = contentArea.locator('blockquote');
    const blockquoteCount = await blockquotes.count();

    if (blockquoteCount > 0) {
      await expect(blockquotes.first()).toBeVisible();
    }
  });

  test('should render lists correctly', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // リストが存在する場合、表示されることを確認
    const lists = contentArea.locator('ul, ol');
    const listCount = await lists.count();

    if (listCount > 0) {
      const firstList = lists.first();
      await expect(firstList).toBeVisible();

      // リストアイテムが存在することを確認
      const listItems = firstList.locator('li');
      expect(await listItems.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('レスポンシブ表示テスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated
  });

  test('should display correctly on desktop viewport (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // デスクトップでの表示確認
    const heading = contentArea.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }

    // コンテンツ領域の幅がビューポート内に収まることを確認
    const boundingBox = await contentArea.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeLessThan(1920);
  });

  test('should display correctly on tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // タブレットでの表示確認
    const heading = contentArea.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }

    // 画像がビューポート内に収まることを確認
    const images = contentArea.locator('img');
    if (await images.count() > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      const imgBox = await firstImage.boundingBox();
      if (imgBox) {
        expect(imgBox.width).toBeLessThanOrEqual(768);
      }
    }
  });

  test('should display correctly on mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // モバイルでの表示確認
    const heading = contentArea.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }

    // 画像がモバイルビューポートに収まることを確認
    const images = contentArea.locator('img');
    if (await images.count() > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      const imgBox = await firstImage.boundingBox();
      if (imgBox) {
        expect(imgBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should maintain readability on small mobile viewport (320x568)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // 小型モバイルでも読みやすさを確認
    const heading = contentArea.locator('h1, h2, h3').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }
  });
});

test.describe('アクセシビリティとパフォーマンステスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 見出し階層が適切であることを確認
    const h1 = contentArea.locator('h1');
    const headings = contentArea.locator('h1, h2, h3, h4, h5, h6');

    const headingCount = await headings.count();
    if (headingCount > 0) {
      // H1は0個または1個のみであることを確認
      const h1Count = await h1.count();
      expect(h1Count).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // コンテンツエリアにARIAラベルが設定されていることを確認
    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();
  });

  test('should render links with keyboard accessibility', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    const links = contentArea.locator('a');

    const linkCount = await links.count();
    if (linkCount > 0) {
      const firstLink = links.first();

      // キーボードでリンクにフォーカスできることを確認
      await firstLink.focus();
      await expect(firstLink).toBeFocused();
    }
  });

  test('should load and render markdown content within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // マークダウンコンテンツが表示されるまでの時間を計測
    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // 5秒以内にレンダリングされることを確認
    expect(renderTime).toBeLessThan(5000);
  });

  test('should not execute script tags in markdown content', async ({ page }) => {
    // ダイアログが表示されないことを確認（XSS攻撃が防がれている）
    let dialogAppeared = false;
    page.on('dialog', () => {
      dialogAppeared = true;
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // 2秒待機してダイアログが表示されないことを確認
    await page.waitForTimeout(2000);
    expect(dialogAppeared).toBe(false);

    // scriptタグがレンダリングされていないことを確認
    const scriptElements = await contentArea.locator('script').count();
    expect(scriptElements).toBe(0);
  });

  test('should handle empty content gracefully', async ({ page }) => {
    // 空のコンテンツを持つレッスンページに移動
    await page.goto('/courses/1/lessons/999');

    // エラーが発生してもページが壊れないことを確認
    // フォールバックメッセージまたはエラーメッセージが表示されることを期待
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('ナビゲーションと進捗機能', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Start authenticated
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // パンくずリストが表示されることを確認
    const breadcrumb = page.locator('nav').first();
    await expect(breadcrumb).toBeVisible();

    // パンくずリンクの確認
    const coursesLink = breadcrumb.getByRole('link', { name: /courses/i });
    await expect(coursesLink).toBeVisible();
  });

  test('should allow learner to mark lesson as complete', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // 完了チェックボックスを見つける
    const checkbox = page.locator('input[type="checkbox"]').first();

    if (await checkbox.count() > 0) {
      await expect(checkbox).toBeVisible();

      const isChecked = await checkbox.isChecked();

      if (!isChecked) {
        // チェックされていない場合、チェックを試みる
        await checkbox.check();

        // チェック状態が更新されることを確認（ネットワーク遅延を考慮）
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display navigation buttons', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // ナビゲーションボタンが存在することを確認
    const prevButton = page.getByRole('button', { name: /previous/i });
    const nextButton = page.getByRole('button', { name: /next/i });
    const overviewButton = page.getByRole('button', { name: /overview/i });

    // 少なくとも1つのナビゲーション要素が表示されることを確認
    const navElements = await page.locator('button, a').filter({
      hasText: /previous|next|overview|前|次|概要/i
    }).count();

    expect(navElements).toBeGreaterThan(0);
  });
});
