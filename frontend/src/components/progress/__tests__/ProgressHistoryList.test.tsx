import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { ProgressHistoryList } from '../ProgressHistoryList';
import i18n from '../../../i18n';
import type { ProgressHistoryEntry } from '@/types';

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('ProgressHistoryList', () => {
  const mockHistory: ProgressHistoryEntry[] = [
    {
      id: 1,
      progressRate: 100,
      spentMinutes: 45,
      changedBy: 1,
      notes: 'コース完了しました',
      createdAt: '2025-10-07T10:00:00Z',
      delta: 25,
    },
    {
      id: 2,
      progressRate: 75,
      spentMinutes: 30,
      changedBy: 1,
      notes: null,
      createdAt: '2025-10-07T09:00:00Z',
      delta: 25,
    },
    {
      id: 3,
      progressRate: 50,
      spentMinutes: 20,
      changedBy: 1,
      notes: null,
      createdAt: '2025-10-07T08:00:00Z',
      delta: 50,
    },
  ];

  describe('タスク9.2: 進捗履歴一覧コンポーネント', () => {
    it('日時、進捗率、変更差分を表示する', () => {
      renderWithI18n(<ProgressHistoryList history={mockHistory} isLoading={false} />);

      // 進捗率の表示確認
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      // 差分の表示確認
      expect(screen.getByText('+25%')).toBeInTheDocument();
      expect(screen.getByText('+50%')).toBeInTheDocument();
    });

    it('日時の新しい順にソート表示される', () => {
      renderWithI18n(<ProgressHistoryList history={mockHistory} isLoading={false} />);

      const progressRates = screen.getAllByText(/\d+%/).filter(el => 
        el.classList.contains('text-2xl')
      );
      
      // 新しい順: 100%, 75%, 50%
      expect(progressRates[0]).toHaveTextContent('100%');
      expect(progressRates[1]).toHaveTextContent('75%');
      expect(progressRates[2]).toHaveTextContent('50%');
    });

    it('メモがある場合はメモも表示する', () => {
      renderWithI18n(<ProgressHistoryList history={mockHistory} isLoading={false} />);

      expect(screen.getByText('コース完了しました')).toBeInTheDocument();
    });

    it('学習時間を表示する', () => {
      renderWithI18n(<ProgressHistoryList history={mockHistory} isLoading={false} />);

      expect(screen.getByText('学習時間: 45分')).toBeInTheDocument();
      expect(screen.getByText('学習時間: 30分')).toBeInTheDocument();
      expect(screen.getByText('学習時間: 20分')).toBeInTheDocument();
    });

    it('差分が正の場合は緑色で表示する', () => {
      renderWithI18n(<ProgressHistoryList history={mockHistory} isLoading={false} />);

      const positiveDelta = screen.getAllByText('+25%')[0];
      expect(positiveDelta).toHaveClass('text-green-600');
    });

    it('差分が負の場合は赤色で表示する', () => {
      const historyWithNegativeDelta: ProgressHistoryEntry[] = [
        {
          id: 1,
          progressRate: 50,
          spentMinutes: 10,
          changedBy: 1,
          notes: null,
          createdAt: '2025-10-07T10:00:00Z',
          delta: -25,
        },
      ];

      renderWithI18n(<ProgressHistoryList history={historyWithNegativeDelta} isLoading={false} />);

      const negativeDelta = screen.getByText('-25%');
      expect(negativeDelta).toHaveClass('text-red-600');
    });

    it('履歴が存在しない場合はメッセージを表示する', () => {
      renderWithI18n(<ProgressHistoryList history={[]} isLoading={false} />);

      expect(screen.getByText('まだ進捗の記録がありません')).toBeInTheDocument();
    });

    it('ローディング中はローディング表示をする', () => {
      renderWithI18n(<ProgressHistoryList history={[]} isLoading={true} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('日時のフォーマット', () => {
    it('日時を日本語形式でフォーマットする', () => {
      const history: ProgressHistoryEntry[] = [
        {
          id: 1,
          progressRate: 100,
          spentMinutes: 30,
          changedBy: 1,
          notes: null,
          createdAt: '2025-10-07T14:30:00Z',
          delta: 0,
        },
      ];

      renderWithI18n(<ProgressHistoryList history={history} isLoading={false} />);

      // 日時が表示されていることを確認（具体的なフォーマットはロケールに依存）
      const dateElement = screen.getByText(/2025/);
      expect(dateElement).toBeInTheDocument();
    });
  });

  describe('学習時間の表示', () => {
    it('学習時間が0分の場合は表示しない', () => {
      const history: ProgressHistoryEntry[] = [
        {
          id: 1,
          progressRate: 50,
          spentMinutes: 0,
          changedBy: 1,
          notes: null,
          createdAt: '2025-10-07T10:00:00Z',
          delta: 0,
        },
      ];

      renderWithI18n(<ProgressHistoryList history={history} isLoading={false} />);

      expect(screen.queryByText(/学習時間/)).not.toBeInTheDocument();
    });
  });
});
