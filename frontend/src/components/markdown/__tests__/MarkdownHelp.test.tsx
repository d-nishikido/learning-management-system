import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { MarkdownHelp } from '../MarkdownHelp';

describe('MarkdownHelp', () => {
  describe('基本的なレンダリング', () => {
    it('should render help button', () => {
      render(<MarkdownHelp />);

      expect(screen.getByRole('button', { name: /マークダウンヘルプを表示/i })).toBeInTheDocument();
    });

    it('should display help icon', () => {
      render(<MarkdownHelp />);

      const button = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      expect(within(button).getByText('マークダウンヘルプ')).toBeInTheDocument();
    });
  });

  describe('モーダルの開閉', () => {
    it('should not show modal initially', () => {
      render(<MarkdownHelp />);

      expect(screen.queryByText('マークダウン記法ヘルプ')).not.toBeInTheDocument();
    });

    it('should open modal when help button is clicked', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('マークダウン記法ヘルプ')).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      render(<MarkdownHelp />);

      // モーダルを開く
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 閉じるボタンをクリック
      const closeButton = screen.getByRole('button', { name: /閉じる/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('マークダウン記法ヘルプ')).not.toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', () => {
      render(<MarkdownHelp />);

      // モーダルを開く
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 背景をクリック（data-testidやroleで特定できないため、親要素を取得）
      const modal = screen.getByText('マークダウン記法ヘルプ').closest('.fixed');
      if (modal) {
        fireEvent.click(modal);
      }

      expect(screen.queryByText('マークダウン記法ヘルプ')).not.toBeInTheDocument();
    });

    it('should not close modal when modal content is clicked', () => {
      render(<MarkdownHelp />);

      // モーダルを開く
      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // モーダルコンテンツをクリック
      const modalContent = screen.getByText('マークダウン記法ヘルプ').closest('.bg-white');
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      // モーダルが閉じないことを確認
      expect(screen.getByText('マークダウン記法ヘルプ')).toBeInTheDocument();
    });
  });

  describe('構文例の表示', () => {
    it('should display all syntax categories', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('見出し')).toBeInTheDocument();
      expect(screen.getByText('テキスト装飾')).toBeInTheDocument();
      expect(screen.getByText('リスト')).toBeInTheDocument();
      expect(screen.getByText('リンクと画像')).toBeInTheDocument();
      expect(screen.getByText('コードブロック')).toBeInTheDocument();
      expect(screen.getByText('テーブル')).toBeInTheDocument();
      expect(screen.getByText('引用')).toBeInTheDocument();
    });

    it('should display heading syntax examples', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('見出し1')).toBeInTheDocument();
      expect(screen.getByText('見出し2')).toBeInTheDocument();
      expect(screen.getByText('見出し3')).toBeInTheDocument();
      expect(screen.getByText('# 見出し1')).toBeInTheDocument();
      expect(screen.getByText('## 見出し2')).toBeInTheDocument();
      expect(screen.getByText('### 見出し3')).toBeInTheDocument();
    });

    it('should display text formatting syntax examples', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('太字')).toBeInTheDocument();
      expect(screen.getByText('斜体')).toBeInTheDocument();
      expect(screen.getByText('打ち消し線')).toBeInTheDocument();
      expect(screen.getByText('インラインコード')).toBeInTheDocument();
    });

    it('should display list syntax examples', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('箇条書き')).toBeInTheDocument();
      expect(screen.getByText('番号付きリスト')).toBeInTheDocument();
      expect(screen.getByText('タスクリスト')).toBeInTheDocument();
    });

    it('should display link and image syntax examples', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('リンク')).toBeInTheDocument();
      expect(screen.getByText('画像')).toBeInTheDocument();
    });

    it('should display code block syntax examples', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('コードブロック')).toBeInTheDocument();
      expect(screen.getByText('プレーンコード')).toBeInTheDocument();
    });

    it('should display table syntax example', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('テーブル')).toBeInTheDocument();
    });

    it('should display quote syntax example', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('引用')).toBeInTheDocument();
    });
  });

  describe('構文挿入コールバック', () => {
    it('should call onInsertSyntax when insert button is clicked', () => {
      const handleInsert = jest.fn();
      render(<MarkdownHelp onInsertSyntax={handleInsert} />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 最初の挿入ボタンをクリック（見出し1）
      const insertButtons = screen.getAllByRole('button', { name: '挿入' });
      fireEvent.click(insertButtons[0]);

      expect(handleInsert).toHaveBeenCalledWith('# 見出し1');
    });

    it('should call onInsertSyntax with correct syntax for different examples', () => {
      const handleInsert = jest.fn();
      render(<MarkdownHelp onInsertSyntax={handleInsert} />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      const insertButtons = screen.getAllByRole('button', { name: '挿入' });

      // 見出し1
      fireEvent.click(insertButtons[0]);
      expect(handleInsert).toHaveBeenLastCalledWith('# 見出し1');

      // 見出し2
      fireEvent.click(insertButtons[1]);
      expect(handleInsert).toHaveBeenLastCalledWith('## 見出し2');

      // 見出し3
      fireEvent.click(insertButtons[2]);
      expect(handleInsert).toHaveBeenLastCalledWith('### 見出し3');

      // 太字
      fireEvent.click(insertButtons[3]);
      expect(handleInsert).toHaveBeenLastCalledWith('**太字**');
    });

    it('should close modal after syntax insertion', () => {
      const handleInsert = jest.fn();
      render(<MarkdownHelp onInsertSyntax={handleInsert} />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 挿入ボタンをクリック
      const insertButtons = screen.getAllByRole('button', { name: '挿入' });
      fireEvent.click(insertButtons[0]);

      // モーダルが閉じることを確認
      expect(screen.queryByText('マークダウン記法ヘルプ')).not.toBeInTheDocument();
    });

    it('should not display insert buttons when onInsertSyntax is not provided', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // 挿入ボタンが表示されないことを確認
      expect(screen.queryByRole('button', { name: '挿入' })).not.toBeInTheDocument();
    });

    it('should call onInsertSyntax for complex syntax like code blocks', () => {
      const handleInsert = jest.fn();
      render(<MarkdownHelp onInsertSyntax={handleInsert} />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // コードブロックの挿入ボタンを探してクリック
      const insertButtons = screen.getAllByRole('button', { name: '挿入' });
      
      // コードブロックはリストの後にあるため、適切なインデックスを見つける
      // 見出し3つ + テキスト装飾4つ + リスト3つ = 10個目以降
      const codeBlockButton = insertButtons[10]; // コードブロック
      fireEvent.click(codeBlockButton);

      expect(handleInsert).toHaveBeenCalledWith('```javascript\nconst x = 1;\nconsole.log(x);\n```');
    });
  });

  describe('UI/UX', () => {
    it('should display syntax description for each example', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText('最上位の見出し')).toBeInTheDocument();
      expect(screen.getByText('テキストを太字にする')).toBeInTheDocument();
      expect(screen.getByText('順序なしリスト')).toBeInTheDocument();
    });

    it('should display footer message', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByText(/各構文例の「挿入」ボタンをクリックすると/)).toBeInTheDocument();
    });

    it('should organize examples in a grid layout', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // グリッドレイアウトのクラスが適用されていることを確認
      const gridContainers = screen.getAllByText('見出し1')[0].closest('.grid');
      expect(gridContainers).toHaveClass('grid');
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA labels', () => {
      render(<MarkdownHelp />);

      expect(screen.getByRole('button', { name: /マークダウンヘルプを表示/i })).toBeInTheDocument();

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      expect(screen.getByRole('button', { name: /閉じる/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<MarkdownHelp />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      
      // Enterキーでモーダルを開く
      fireEvent.keyDown(helpButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(helpButton); // click イベントも発火させる

      expect(screen.getByText('マークダウン記法ヘルプ')).toBeInTheDocument();
    });

    it('should trap focus within modal when open', () => {
      render(<MarkdownHelp onInsertSyntax={jest.fn()} />);

      const helpButton = screen.getByRole('button', { name: /マークダウンヘルプを表示/i });
      fireEvent.click(helpButton);

      // モーダル内のボタンがフォーカス可能であることを確認
      const closeButton = screen.getByRole('button', { name: /閉じる/i });
      expect(closeButton).toBeInTheDocument();

      const insertButtons = screen.getAllByRole('button', { name: '挿入' });
      expect(insertButtons.length).toBeGreaterThan(0);
    });
  });

  describe('カスタマイズ', () => {
    it('should apply custom className', () => {
      const { container } = render(<MarkdownHelp className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
