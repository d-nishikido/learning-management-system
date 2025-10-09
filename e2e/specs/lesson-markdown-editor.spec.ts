import { test, expect } from '@fixtures/auth';
import { waitForAPIResponse } from '@utils/test-helpers';

test.describe('Lesson Markdown Editor Integration', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // Navigate to lesson form (create or edit)
    await page.goto('/admin/courses/1/lessons/new');
    await page.waitForLoadState('networkidle');
  });

  test.describe('マークダウン編集機能', () => {
    test('should display markdown editor with textarea and preview', async ({ page }) => {
      // マークダウンエディターが表示されることを確認
      const editor = page.locator('textarea').filter({ hasText: /マークダウンを入力/ }).or(page.locator('textarea[placeholder*="マークダウン"]'));
      await expect(editor).toBeVisible();

      // プレビューエリアが表示されることを確認（デスクトップ表示）
      const preview = page.getByText('プレビュー').first();
      await expect(preview).toBeVisible();

      // マークダウンヘルプボタンが表示されることを確認
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプ/ });
      await expect(helpButton).toBeVisible();
    });

    test('should allow typing markdown content', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // マークダウンを入力
      await textarea.fill('# テスト見出し\n\nこれはテストコンテンツです。');
      
      // 入力した内容が保持されることを確認
      await expect(textarea).toHaveValue('# テスト見出し\n\nこれはテストコンテンツです。');
    });

    test('should handle large markdown content', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // 大きなコンテンツを入力
      const largeContent = Array.from({ length: 100 }, (_, i) => `## セクション ${i + 1}\n\nコンテンツ ${i + 1}`).join('\n\n');
      await textarea.fill(largeContent);
      
      // 入力が正常に処理されることを確認
      await expect(textarea).toHaveValue(largeContent);
    });
  });

  test.describe('プレビューのリアルタイム更新', () => {
    test('should update preview in real-time when typing markdown', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // 見出しを入力
      await textarea.fill('# リアルタイムプレビュー');
      
      // プレビューエリアで見出しがレンダリングされることを確認
      // プレビューはMarkdownViewerコンポーネント内にある
      const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
      await expect(previewArea.getByRole('heading', { level: 1, name: 'リアルタイムプレビュー' })).toBeVisible({ timeout: 3000 });
    });

    test('should render markdown lists in preview', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // リストを入力
      await textarea.fill('- 項目1\n- 項目2\n- 項目3');
      
      // プレビューでリストがレンダリングされることを確認
      const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
      const listItems = previewArea.locator('li');
      await expect(listItems).toHaveCount(3, { timeout: 3000 });
      await expect(listItems.nth(0)).toContainText('項目1');
      await expect(listItems.nth(1)).toContainText('項目2');
      await expect(listItems.nth(2)).toContainText('項目3');
    });

    test('should render markdown code blocks with syntax highlighting', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // コードブロックを入力
      await textarea.fill('```javascript\nconst greeting = "Hello";\nconsole.log(greeting);\n```');
      
      // プレビューでコードブロックがレンダリングされることを確認
      const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
      await expect(previewArea.getByText('const greeting')).toBeVisible({ timeout: 3000 });
      await expect(previewArea.getByText('console.log')).toBeVisible();
    });

    test('should render markdown links correctly', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // リンクを入力
      await textarea.fill('[テストリンク](https://example.com)');
      
      // プレビューでリンクがレンダリングされることを確認
      const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
      const link = previewArea.getByRole('link', { name: 'テストリンク' });
      await expect(link).toBeVisible({ timeout: 3000 });
      await expect(link).toHaveAttribute('href', 'https://example.com');
    });

    test('should show fallback content when textarea is empty', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // テキストエリアが空の状態を確認
      await expect(textarea).toBeEmpty();
      
      // フォールバックコンテンツが表示されることを確認
      const fallback = page.getByText('プレビューがここに表示されます').or(page.getByText('コンテンツなし'));
      await expect(fallback).toBeVisible();
    });
  });

  test.describe('モバイルビューのタブ切り替え', () => {
    test('should switch between edit and preview tabs on mobile', async ({ page }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/courses/1/lessons/new');
      await page.waitForLoadState('networkidle');
      
      // タブボタンが表示されることを確認
      const editTab = page.getByRole('button', { name: '編集' });
      const previewTab = page.getByRole('button', { name: 'プレビュー' });
      
      await expect(editTab).toBeVisible();
      await expect(previewTab).toBeVisible();
      
      // 初期状態は編集タブがアクティブ
      await expect(editTab).toHaveClass(/text-blue-600/);
      
      // プレビュータブをクリック
      await previewTab.click();
      await expect(previewTab).toHaveClass(/text-blue-600/);
      
      // 編集タブに戻る
      await editTab.click();
      await expect(editTab).toHaveClass(/text-blue-600/);
    });

    test('should hide edit area when preview tab is active on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/courses/1/lessons/new');
      await page.waitForLoadState('networkidle');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      const previewTab = page.getByRole('button', { name: 'プレビュー' });
      
      // プレビュータブに切り替え
      await previewTab.click();
      
      // 編集エリアが非表示になることを確認（モバイルでは）
      // hidden クラスが適用されるか、display: none になる
      await expect(textarea).not.toBeVisible();
    });
  });

  test.describe('マークダウンヘルプ機能', () => {
    test('should open and close markdown help modal', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプ/ });
      
      // ヘルプモーダルを開く
      await helpButton.click();
      
      // モーダルが表示されることを確認
      await expect(page.getByText('マークダウン記法ヘルプ')).toBeVisible();
      
      // 閉じるボタンをクリック
      const closeButton = page.getByRole('button', { name: /閉じる/ });
      await closeButton.click();
      
      // モーダルが閉じることを確認
      await expect(page.getByText('マークダウン記法ヘルプ')).not.toBeVisible();
    });

    test('should display syntax categories in help modal', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプ/ });
      await helpButton.click();
      
      // 各カテゴリが表示されることを確認
      await expect(page.getByText('見出し')).toBeVisible();
      await expect(page.getByText('テキスト装飾')).toBeVisible();
      await expect(page.getByText('リスト')).toBeVisible();
      await expect(page.getByText('リンクと画像')).toBeVisible();
      await expect(page.getByText('コードブロック')).toBeVisible();
    });

    test('should insert syntax when clicking insert button', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプ/ });
      
      // 初期状態を確認
      await expect(textarea).toBeEmpty();
      
      // ヘルプモーダルを開く
      await helpButton.click();
      
      // 挿入ボタンをクリック（最初の挿入ボタン = 見出し1）
      const insertButtons = page.getByRole('button', { name: '挿入' });
      await insertButtons.first().click();
      
      // テキストエリアに構文が挿入されることを確認
      await expect(textarea).toHaveValue('# 見出し1');
      
      // モーダルが自動的に閉じることを確認
      await expect(page.getByText('マークダウン記法ヘルプ')).not.toBeVisible();
    });

    test('should insert syntax at cursor position', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプ/ });
      
      // 既存のテキストを入力
      await textarea.fill('Hello World');
      
      // カーソル位置を設定（"Hello" と "World" の間）
      await textarea.press('Home');
      for (let i = 0; i < 5; i++) {
        await textarea.press('ArrowRight');
      }
      
      // ヘルプモーダルを開いて構文を挿入
      await helpButton.click();
      const insertButtons = page.getByRole('button', { name: '挿入' });
      
      // 太字を挿入（テキスト装飾カテゴリの最初）
      await insertButtons.nth(3).click();
      
      // カーソル位置に挿入されることを確認
      await expect(textarea).toHaveValue('Hello**太字** World');
    });
  });

  test.describe('保存とAPI送信', () => {
    test('should save lesson with markdown content', async ({ page }) => {
      // レッスンフォームのフィールドを入力
      await page.fill('input[name="title"]', 'マークダウンレッスン');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# レッスン内容\n\nこれはマークダウンで書かれたレッスンです。');
      
      // 保存ボタンをクリック
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      
      // APIリクエストを監視
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/v1/lessons') && 
                   (response.request().method() === 'POST' || response.request().method() === 'PUT')
      );
      
      await saveButton.click();
      const response = await responsePromise;
      
      // レスポンスが成功することを確認
      expect(response.status()).toBe(201 || 200);
      
      // レスポンスボディを確認
      const responseBody = await response.json();
      expect(responseBody.data.content).toContain('# レッスン内容');
    });

    test('should display success message after saving', async ({ page }) => {
      await page.fill('input[name="title"]', 'テストレッスン');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# テストコンテンツ');
      
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      await saveButton.click();
      
      // 成功メッセージが表示されることを確認
      const successMessage = page.getByText(/保存しました|作成しました/).or(page.locator('.alert-success'));
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to lesson detail page after saving', async ({ page }) => {
      await page.fill('input[name="title"]', 'リダイレクトテスト');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# リダイレクトテスト');
      
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      await saveButton.click();
      
      // レッスン詳細ページにリダイレクトされることを確認
      await page.waitForURL(/\/lessons\/\d+/, { timeout: 5000 });
      
      // 保存したマークダウンが正しく表示されることを確認
      await expect(page.getByRole('heading', { level: 1, name: 'リダイレクトテスト' })).toBeVisible();
    });

    test('should display validation errors for empty required fields', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# コンテンツのみ');
      
      // タイトルを空のままで保存を試みる
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      await saveButton.click();
      
      // バリデーションエラーが表示されることを確認
      const errorMessage = page.getByText(/タイトルは必須/).or(page.locator('.error-message'));
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('レッスン編集時の動作', () => {
    test('should load existing markdown content when editing', async ({ page }) => {
      // 既存のレッスンを編集
      await page.goto('/admin/courses/1/lessons/1/edit');
      await waitForAPIResponse(page, '/api/v1/lessons/1');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // 既存のコンテンツが読み込まれることを確認
      await expect(textarea).not.toBeEmpty();
      
      // プレビューにも既存のコンテンツが表示されることを確認
      const previewArea = page.locator('.prose').or(page.locator('[aria-label*="プレビュー"]'));
      await expect(previewArea).not.toBeEmpty();
    });

    test('should update existing lesson with modified markdown', async ({ page }) => {
      await page.goto('/admin/courses/1/lessons/1/edit');
      await waitForAPIResponse(page, '/api/v1/lessons/1');
      
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // コンテンツを変更
      await textarea.fill('# 更新されたコンテンツ\n\n変更後のレッスン内容です。');
      
      // 保存ボタンをクリック
      const saveButton = page.getByRole('button', { name: /保存|更新/ });
      
      // PUTリクエストを監視
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/v1/lessons/1') && 
                   response.request().method() === 'PUT'
      );
      
      await saveButton.click();
      const response = await responsePromise;
      
      // レスポンスが成功することを確認
      expect(response.status()).toBe(200);
      
      // 更新されたコンテンツが送信されることを確認
      const responseBody = await response.json();
      expect(responseBody.data.content).toContain('更新されたコンテンツ');
    });
  });

  test.describe('アクセシビリティ', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // マークダウンヘルプボタンのARIAラベルを確認
      const helpButton = page.getByRole('button', { name: /マークダウンヘルプを表示/ });
      await expect(helpButton).toBeVisible();
      
      // プレビューエリアのARIAラベルを確認
      const preview = page.getByLabel('マークダウンプレビュー');
      await expect(preview).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      
      // Tabキーでフォーカス
      await page.keyboard.press('Tab');
      await expect(textarea).toBeFocused();
      
      // テキスト入力
      await page.keyboard.type('# キーボードナビゲーション');
      await expect(textarea).toHaveValue('# キーボードナビゲーション');
    });
  });

  test.describe('エラーハンドリング', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // APIエラーをシミュレート
      await page.route('**/api/v1/lessons', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'Internal Server Error' })
        });
      });
      
      await page.fill('input[name="title"]', 'エラーテスト');
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# エラーテスト');
      
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      await saveButton.click();
      
      // エラーメッセージが表示されることを確認
      const errorMessage = page.getByText(/エラー|失敗/).or(page.locator('.alert-error'));
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should handle network timeout', async ({ page }) => {
      // ネットワークタイムアウトをシミュレート
      await page.route('**/api/v1/lessons', route => {
        // リクエストを遅延させてタイムアウトさせる
        setTimeout(() => {
          route.abort();
        }, 5000);
      });
      
      await page.fill('input[name="title"]', 'タイムアウトテスト');
      const textarea = page.locator('textarea[placeholder*="マークダウン"]');
      await textarea.fill('# タイムアウトテスト');
      
      const saveButton = page.getByRole('button', { name: /保存|作成/ });
      await saveButton.click();
      
      // タイムアウトエラーメッセージが表示されることを確認
      const errorMessage = page.getByText(/タイムアウト|接続エラー/).or(page.locator('.alert-error'));
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});
