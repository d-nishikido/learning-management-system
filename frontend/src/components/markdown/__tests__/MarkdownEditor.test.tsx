import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { MarkdownEditor } from '../MarkdownEditor';
import userEvent from '@testing-library/user-event';

describe('MarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('should render editor and preview areas on desktop', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByText('マークダウン編集')).toBeInTheDocument();
      expect(screen.getByText('プレビュー')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('マークダウンを入力してください...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <MarkdownEditor
          {...defaultProps}
          placeholder="カスタムプレースホルダー"
        />
      );

      expect(screen.getByPlaceholderText('カスタムプレースホルダー')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(
        <MarkdownEditor
          {...defaultProps}
          label="コンテンツ編集"
        />
      );

      expect(screen.getByText('コンテンツ編集')).toBeInTheDocument();
    });

    it('should display error message when provided', () => {
      render(
        <MarkdownEditor
          {...defaultProps}
          error="入力エラーが発生しました"
        />
      );

      expect(screen.getByText('入力エラーが発生しました')).toBeInTheDocument();
    });

    it('should render markdown help button', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByRole('button', { name: /マークダウンヘルプを表示/i })).toBeInTheDocument();
    });
  });

  describe('onChangeコールバック', () => {
    it('should call onChange when text is entered', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<MarkdownEditor value="" onChange={handleChange} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      await user.type(textarea, 'Hello World');

      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenLastCalledWith('Hello World');
    });

    it('should call onChange for each character typed', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<MarkdownEditor value="" onChange={handleChange} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      await user.type(textarea, 'ABC');

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should update textarea value when value prop changes', () => {
      const { rerender } = render(<MarkdownEditor {...defaultProps} value="Initial" />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial');

      rerender(<MarkdownEditor {...defaultProps} value="Updated" />);
      expect(textarea.value).toBe('Updated');
    });
  });

  describe('プレビューのリアルタイム更新', () => {
    it('should update preview when markdown content changes', () => {
      const { rerender } = render(<MarkdownEditor {...defaultProps} value="# Hello" />);

      // 見出しがレンダリングされていることを確認
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');

      // 値を更新
      rerender(<MarkdownEditor {...defaultProps} value="## World" />);

      // プレビューが更新されていることを確認
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('World');
    });

    it('should show fallback content when value is empty', () => {
      render(<MarkdownEditor {...defaultProps} value="" />);

      expect(screen.getByText('プレビューがここに表示されます')).toBeInTheDocument();
    });

    it('should render markdown with lists in preview', () => {
      render(<MarkdownEditor {...defaultProps} value="- Item 1\n- Item 2\n- Item 3" />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toHaveTextContent('Item 1');
    });

    it('should render markdown with code blocks in preview', () => {
      const codeContent = '```javascript\nconst x = 1;\n```';
      render(<MarkdownEditor {...defaultProps} value={codeContent} />);

      expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
    });
  });

  describe('モバイルビューのタブ切り替え', () => {
    it('should render tab buttons on mobile', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const editTab = screen.getByRole('button', { name: '編集' });
      const previewTab = screen.getByRole('button', { name: 'プレビュー' });

      expect(editTab).toBeInTheDocument();
      expect(previewTab).toBeInTheDocument();
    });

    it('should switch to preview tab when clicked', () => {
      render(<MarkdownEditor {...defaultProps} value="# Test" />);

      const previewTab = screen.getByRole('button', { name: 'プレビュー' });
      fireEvent.click(previewTab);

      // プレビュータブがアクティブになっていることを確認
      expect(previewTab).toHaveClass('text-blue-600', 'border-blue-600');
    });

    it('should switch back to edit tab when clicked', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const editTab = screen.getByRole('button', { name: '編集' });
      const previewTab = screen.getByRole('button', { name: 'プレビュー' });

      // プレビュータブに切り替え
      fireEvent.click(previewTab);
      expect(previewTab).toHaveClass('text-blue-600');

      // 編集タブに戻る
      fireEvent.click(editTab);
      expect(editTab).toHaveClass('text-blue-600');
    });

    it('should default to edit tab', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const editTab = screen.getByRole('button', { name: '編集' });
      expect(editTab).toHaveClass('text-blue-600', 'border-blue-600');
    });
  });

  describe('無効化状態', () => {
    it('should disable textarea when disabled prop is true', () => {
      render(<MarkdownEditor {...defaultProps} disabled={true} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...') as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass('bg-gray-100', 'cursor-not-allowed');
    });

    it('should not call onChange when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<MarkdownEditor value="" onChange={handleChange} disabled={true} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      
      // 無効化されたテキストエリアに入力を試みる
      await user.type(textarea, 'Test');

      // onChangeが呼ばれないことを確認
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('高さのカスタマイズ', () => {
    it('should apply custom height', () => {
      render(<MarkdownEditor {...defaultProps} height="600px" />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      expect(textarea).toHaveStyle({ height: '600px' });
    });

    it('should use default height when not specified', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      expect(textarea).toHaveStyle({ height: '400px' });
    });
  });

  describe('エラー状態のスタイリング', () => {
    it('should apply error border when error prop is provided', () => {
      render(<MarkdownEditor {...defaultProps} error="エラーメッセージ" />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('should apply normal border when no error', () => {
      render(<MarkdownEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      expect(textarea).toHaveClass('border-gray-300');
    });
  });

  describe('マークダウンヘルプとの統合', () => {
    it('should insert syntax when help syntax is clicked', async () => {
      const handleChange = jest.fn();
      render(<MarkdownEditor value="" onChange={handleChange} />);

      // ヘルプボタンをクリック
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // ヘルプモーダルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('マークダウン記法ヘルプ')).toBeInTheDocument();
      });

      // 「見出し1」の挿入ボタンをクリック
      const insertButtons = screen.getAllByRole('button', { name: '挿入' });
      fireEvent.click(insertButtons[0]);

      // onChangeが挿入された構文で呼ばれることを確認
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('# 見出し1');
      });
    });

    it('should insert syntax at cursor position', async () => {
      const handleChange = jest.fn();
      render(<MarkdownEditor value="Hello World" onChange={handleChange} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...') as HTMLTextAreaElement;
      
      // カーソル位置を設定（"Hello" と "World" の間）
      textarea.setSelectionRange(5, 5);

      // ヘルプボタンをクリック
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 太字の挿入ボタンをクリック（テキスト装飾カテゴリの最初）
      await waitFor(() => {
        const insertButtons = screen.getAllByRole('button', { name: '挿入' });
        // 見出し3つ分をスキップして、テキスト装飾の最初（太字）を取得
        fireEvent.click(insertButtons[3]);
      });

      // カーソル位置に挿入されることを確認
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('Hello**太字** World');
      });
    });

    it('should replace selected text when syntax is inserted', async () => {
      const handleChange = jest.fn();
      render(<MarkdownEditor value="Hello World" onChange={handleChange} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...') as HTMLTextAreaElement;
      
      // テキストを選択（"World"を選択）
      textarea.setSelectionRange(6, 11);

      // ヘルプボタンをクリック
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 構文を挿入
      await waitFor(() => {
        const insertButtons = screen.getAllByRole('button', { name: '挿入' });
        fireEvent.click(insertButtons[3]); // 太字
      });

      // 選択されたテキストが置換されることを確認
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('Hello **太字**');
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA labels', () => {
      render(<MarkdownEditor {...defaultProps} />);

      expect(screen.getByRole('button', { name: /マークダウンヘルプを表示/i })).toBeInTheDocument();
      expect(screen.getByLabelText('マークダウンプレビュー')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MarkdownEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('マークダウンを入力してください...');
      
      // Tabキーでフォーカス
      await user.tab();
      expect(textarea).toHaveFocus();
    });
  });
});
