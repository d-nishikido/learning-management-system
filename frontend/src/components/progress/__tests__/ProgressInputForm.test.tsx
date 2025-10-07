import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { ProgressInputForm } from '../ProgressInputForm';
import i18n from '../../../i18n';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ProgressInputForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('タスク6.1: 基本的な進捗率入力フォーム', () => {
    it('0-100の数値入力フィールドを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
      expect(input.step).toBe('1');
    });

    it('初期進捗率を表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={75}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/) as HTMLInputElement;
      expect(input.value).toBe('75');
    });

    it('モバイル最適化された数値キーパッド入力を設定する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/) as HTMLInputElement;
      expect(input.inputMode).toBe('numeric');
    });
  });

  describe('タスク6.1: リアルタイムバリデーション', () => {
    it('0未満の値でエラーメッセージを表示する', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '-10' } });

      await waitFor(() => {
        expect(screen.getByText('0-100の範囲で入力してください')).toBeInTheDocument();
      });
    });

    it('100超過の値でエラーメッセージを表示する', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '150' } });

      await waitFor(() => {
        expect(screen.getByText('0-100の範囲で入力してください')).toBeInTheDocument();
      });
    });

    it('非整数の値でエラーメッセージを表示する', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '50.5' } });

      await waitFor(() => {
        expect(screen.getByText('整数を入力してください')).toBeInTheDocument();
      });
    });

    it('有効な値の場合はエラーメッセージを表示しない', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '75' } });

      await waitFor(() => {
        expect(screen.queryByText('0-100の範囲で入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('整数を入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('タスク6.2: プログレスバープレビュー', () => {
    it('現在の進捗率を視覚的に表示するプログレスバーを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={60}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const progressBar = screen.getByText('60%').closest('div')?.previousElementSibling;
      expect(progressBar).toBeInTheDocument();
    });

    it('入力値の変更に応じてプログレスバーがリアルタイムで更新される', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '80' } });

      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument();
      });
    });
  });

  describe('タスク6.3: クイック選択ボタン', () => {
    it('0%, 25%, 50%, 75%, 100%のクイック選択ボタンを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByRole('button', { name: '0%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '25%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '75%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
    });

    it('クイック選択ボタンをクリックすると進捗率が設定される', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={0}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const button75 = screen.getByRole('button', { name: '75%' });
      fireEvent.click(button75);

      await waitFor(() => {
        const input = screen.getByLabelText(/進捗率/) as HTMLInputElement;
        expect(input.value).toBe('75');
      });
    });

    it('クイック選択ボタンクリック後、プログレスバーが更新される', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={0}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const button100 = screen.getByRole('button', { name: '100%' });
      fireEvent.click(button100);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('タスク6.4: 学習時間とメモの入力欄', () => {
    it('学習時間（分）の入力フィールドを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/学習時間/) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
      expect(input.min).toBe('0');
    });

    it('メモ入力用のテキストエリアを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textarea = screen.getByLabelText(/メモ/) as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea.maxLength).toBe(1000);
    });

    it('メモの文字数カウンターを表示する', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      expect(screen.getByText('0/1000')).toBeInTheDocument();
    });

    it('メモを入力すると文字数カウンターが更新される', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const textarea = screen.getByLabelText(/メモ/);
      fireEvent.change(textarea, { target: { value: 'テスト入力' } });

      await waitFor(() => {
        expect(screen.getByText('5/1000')).toBeInTheDocument();
      });
    });
  });

  describe('フォーム送信処理', () => {
    it('バリデーション成功時にonSubmitが呼び出される', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '75' } });

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(75, undefined, undefined);
      });
    });

    it('学習時間とメモを含めてonSubmitが呼び出される', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const progressInput = screen.getByLabelText(/進捗率/);
      const timeInput = screen.getByLabelText(/学習時間/);
      const notesInput = screen.getByLabelText(/メモ/);

      fireEvent.change(progressInput, { target: { value: '80' } });
      fireEvent.change(timeInput, { target: { value: '30' } });
      fireEvent.change(notesInput, { target: { value: 'Chapter 3まで完了' } });

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(80, 30, 'Chapter 3まで完了');
      });
    });

    it('バリデーションエラー時はonSubmitが呼び出されない', async () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      );

      const input = screen.getByLabelText(/進捗率/);
      fireEvent.change(input, { target: { value: '150' } });

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('ローディング中は送信ボタンが無効化される', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: '保存中...' });
      expect(submitButton).toBeDisabled();
    });

    it('エラーメッセージが表示される', () => {
      renderWithI18n(
        <ProgressInputForm
          initialProgress={50}
          onSubmit={mockOnSubmit}
          isLoading={false}
          error="ネットワークエラーが発生しました"
        />
      );

      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
    });
  });
});
