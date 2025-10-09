/**
 * アクセシビリティテスト: マークダウンビューアーのWCAG 2.1 AA準拠
 *
 * テスト対象:
 * - セマンティックHTML要素の使用確認
 * - 画像alt属性の保持確認
 * - コードブロックのスクリーンリーダー互換性
 * - キーボードナビゲーション機能
 * - WCAG 2.1 AA準拠確認
 */

import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';
import AxeBuilder from '@axe-core/playwright';

test.describe('マークダウンビューアー: アクセシビリティテスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // 認証済み状態
  });

  test('should use semantic HTML elements for markdown rendering', async ({ page }) => {
    // テスト用のマークダウンコンテンツ
    const markdownContent = `
# メインタイトル（h1）

## サブタイトル（h2）

### 小見出し（h3）

これは段落です。**太字**と*斜体*を含んでいます。

- リスト項目1
- リスト項目2
- リスト項目3

1. 番号付きリスト1
2. 番号付きリスト2

> これは引用です

[リンク](https://example.com)

\`\`\`javascript
console.log("コードブロック");
\`\`\`
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'アクセシビリティテスト',
          content: markdownContent,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // セマンティックHTML要素の確認
    await expect(contentArea.locator('h1')).toHaveCount(1);
    await expect(contentArea.locator('h2')).toHaveCount(1);
    await expect(contentArea.locator('h3')).toHaveCount(1);
    await expect(contentArea.locator('p')).toBeVisible();
    await expect(contentArea.locator('ul')).toBeVisible();
    await expect(contentArea.locator('ol')).toBeVisible();
    await expect(contentArea.locator('blockquote')).toBeVisible();
    await expect(contentArea.locator('a')).toBeVisible();
    await expect(contentArea.locator('pre')).toBeVisible();
  });

  test('should preserve image alt attributes', async ({ page }) => {
    const markdownWithImages = `
# 画像テスト

![説明的なalt属性](https://example.com/image1.jpg)

![もう一つの画像の説明](https://example.com/image2.png)

テキストと画像の混在: ![インライン画像](https://example.com/inline.jpg)
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: '画像アクセシビリティテスト',
          content: markdownWithImages,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 全ての画像がalt属性を持っていることを確認
    const images = contentArea.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText?.length).toBeGreaterThan(0);
    }

    // 特定のalt属性の内容を確認
    await expect(contentArea.locator('img[alt="説明的なalt属性"]')).toBeVisible();
    await expect(contentArea.locator('img[alt="もう一つの画像の説明"]')).toBeVisible();
    await expect(contentArea.locator('img[alt="インライン画像"]')).toBeVisible();
  });

  test('should make code blocks accessible to screen readers', async ({ page }) => {
    const markdownWithCodeBlocks = `
# コードブロックアクセシビリティ

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

\`\`\`python
def calculate(x, y):
    return x + y
\`\`\`

インラインコード: \`const x = 42;\`
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'コードブロックアクセシビリティテスト',
          content: markdownWithCodeBlocks,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // コードブロックが<pre>と<code>要素で構成されていることを確認
    const preElements = contentArea.locator('pre');
    await expect(preElements).toHaveCount(2);

    // 各<pre>要素内に<code>要素が存在することを確認
    for (let i = 0; i < 2; i++) {
      const pre = preElements.nth(i);
      const code = pre.locator('code');
      await expect(code).toBeVisible();
    }

    // インラインコードが<code>要素として存在することを確認
    const inlineCode = contentArea.locator('p code');
    await expect(inlineCode).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const markdownWithLinks = `
# キーボードナビゲーションテスト

[リンク1](https://example.com/1)

[リンク2](https://example.com/2)

[リンク3](https://example.com/3)
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'キーボードナビゲーションテスト',
          content: markdownWithLinks,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // 全てのリンクが取得できることを確認
    const links = contentArea.locator('a');
    await expect(links).toHaveCount(3);

    // Tabキーでリンク間を移動できることを確認
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // リンクにフォーカスが移動するまでTabキーを押す
    let attempts = 0;
    while (focusedElement !== 'A' && attempts < 10) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      attempts++;
    }

    expect(focusedElement).toBe('A');

    // 各リンクがフォーカス可能であることを確認
    for (let i = 0; i < 3; i++) {
      const link = links.nth(i);
      await link.focus();
      const isFocused = await link.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });

  test('should comply with WCAG 2.1 AA standards', async ({ page }) => {
    const comprehensiveMarkdown = `
# WCAG 2.1 AA準拠テスト

これは包括的なアクセシビリティテストです。

## コンテンツの構造

### 見出し階層

正しい見出し階層を使用しています。

## リストと段落

- リスト項目1
- リスト項目2

1. 番号付きリスト1
2. 番号付きリスト2

通常の段落テキストです。**太字**、*斜体*、[リンク](https://example.com)を含みます。

## コードブロック

\`\`\`javascript
// アクセシブルなコードブロック
function example() {
  return "Hello World";
}
\`\`\`

## 引用

> これは引用ブロックです。

## 画像

![説明的なalt属性を持つ画像](https://example.com/accessible-image.jpg)
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'WCAG 2.1 AA準拠テスト',
          content: comprehensiveMarkdown,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    // axe-coreを使用してWCAG 2.1 AA準拠を確認
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 重大な違反がないことを確認
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have sufficient color contrast for text', async ({ page }) => {
    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    await expect(contentArea).toBeVisible();

    // axe-coreを使用して色のコントラストを確認
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[aria-label="レッスンコンテンツ"]')
      .analyze();

    // コントラスト関連の違反がないことを確認
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should provide proper heading hierarchy', async ({ page }) => {
    const markdownWithHeadings = `
# レベル1見出し

## レベル2見出し

### レベル3見出し

#### レベル4見出し

## もう一つのレベル2見出し

### レベル3見出し
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: '見出し階層テスト',
          content: markdownWithHeadings,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');

    // 見出し階層が正しく構築されていることを確認
    await expect(contentArea.locator('h1')).toHaveCount(1);
    await expect(contentArea.locator('h2')).toHaveCount(2);
    await expect(contentArea.locator('h3')).toHaveCount(2);
    await expect(contentArea.locator('h4')).toHaveCount(1);

    // axe-coreで見出し階層を確認
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[aria-label="レッスンコンテンツ"]')
      .analyze();

    // 見出し階層関連の違反がないことを確認
    const headingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id.includes('heading')
    );

    expect(headingViolations).toHaveLength(0);
  });

  test('should have accessible links with descriptive text', async ({ page }) => {
    const markdownWithLinks = `
# リンクアクセシビリティ

[詳しくはこちらをご覧ください](https://example.com/details)

[ドキュメントを読む](https://example.com/docs)

[サポートページへ移動](https://example.com/support)
`;

    await page.route('**/api/v1/lessons/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          title: 'リンクアクセシビリティテスト',
          content: markdownWithLinks,
          order: 1,
          isPublished: true,
          courseId: 1
        })
      });
    });

    await page.goto('/courses/1/lessons/1');
    await waitForAPIResponse(page, '/api/v1/lessons/1');

    const contentArea = page.locator('[aria-label="レッスンコンテンツ"]');
    const links = contentArea.locator('a');

    // 全てのリンクが説明的なテキストを持っていることを確認
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const linkText = await link.textContent();
      expect(linkText?.length).toBeGreaterThan(0);

      // "こちら"、"クリック"などの不適切なリンクテキストがないことを確認
      expect(linkText?.toLowerCase()).not.toBe('こちら');
      expect(linkText?.toLowerCase()).not.toBe('ここ');
      expect(linkText?.toLowerCase()).not.toBe('クリック');
    }
  });
});

test.describe('マークダウンエディター: アクセシビリティテスト', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // 認証済み状態
  });

  test('should have accessible form controls in markdown editor', async ({ page }) => {
    await page.goto('/admin/courses/1/lessons/new');
    await page.waitForLoadState('networkidle');

    // テキストエリアがラベル付けされていることを確認
    const textarea = page.locator('textarea[placeholder*="マークダウン"]');
    await expect(textarea).toBeVisible();

    // axe-coreでフォームコントロールのアクセシビリティを確認
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // フォーム関連の違反がないことを確認
    const formViolations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.id.includes('label') ||
        violation.id.includes('form')
    );

    expect(formViolations).toHaveLength(0);
  });

  test('should support keyboard-only interaction in editor', async ({ page }) => {
    await page.goto('/admin/courses/1/lessons/new');
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('textarea[placeholder*="マークダウン"]');

    // テキストエリアにフォーカスを移動
    await page.keyboard.press('Tab');

    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    let attempts = 0;

    while (focusedElement !== 'TEXTAREA' && attempts < 20) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      attempts++;
    }

    // テキストエリアにフォーカスが移動したことを確認
    expect(focusedElement).toBe('TEXTAREA');

    // キーボードで入力できることを確認
    await page.keyboard.type('# キーボードテスト');
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toContain('キーボードテスト');
  });
});
