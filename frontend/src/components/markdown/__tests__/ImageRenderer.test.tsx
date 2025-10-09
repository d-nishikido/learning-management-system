import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { ImageRenderer } from '../ImageRenderer';

describe('ImageRenderer', () => {
  describe('正常な画像表示', () => {
    it('should render image with src and alt attributes', () => {
      render(<ImageRenderer src="image.png" alt="Test image" />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'image.png');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('should render image with title attribute', () => {
      render(<ImageRenderer src="image.png" alt="Test" title="Image title" />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('title', 'Image title');
    });

    it('should apply responsive styling classes', () => {
      render(<ImageRenderer src="image.png" alt="Test" />);

      const image = screen.getByRole('img');
      expect(image).toHaveClass('max-w-full', 'h-auto', 'rounded-md');
    });

    it('should render empty alt when not provided', () => {
      render(<ImageRenderer src="image.png" />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', '');
    });
  });

  describe('画像読み込みエラー', () => {
    it('should display fallback UI on image load error', () => {
      render(<ImageRenderer src="broken.png" alt="Broken image" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      expect(screen.getByText(/画像を読み込めませんでした/)).toBeInTheDocument();
      expect(screen.getByText(/Broken image/)).toBeInTheDocument();
    });

    it('should display generic message when alt is not provided', () => {
      render(<ImageRenderer src="broken.png" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      expect(screen.getByText(/画像を読み込めませんでした: 画像/)).toBeInTheDocument();
    });

    it('should show error icon in fallback UI', () => {
      render(<ImageRenderer src="broken.png" alt="Test" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      const fallback = screen.getByText(/画像を読み込めませんでした/).closest('div');
      expect(fallback).toBeInTheDocument();
      expect(fallback?.querySelector('svg')).toBeInTheDocument();
    });

    it('should apply error styling classes', () => {
      render(<ImageRenderer src="broken.png" alt="Test" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      const fallback = screen.getByText(/画像を読み込めませんでした/).closest('div');
      expect(fallback).toHaveClass('bg-gray-100', 'rounded-md', 'text-gray-600');
    });
  });

  describe('エラー後の状態管理', () => {
    it('should not show image after error', () => {
      render(<ImageRenderer src="broken.png" alt="Test" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should permanently show fallback after error', () => {
      const { rerender } = render(<ImageRenderer src="broken.png" alt="Test" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      expect(screen.getByText(/画像を読み込めませんでした/)).toBeInTheDocument();

      // 再レンダリングしても状態は保持される
      rerender(<ImageRenderer src="broken.png" alt="Test" />);
      expect(screen.getByText(/画像を読み込めませんでした/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('should preserve alt text for screen readers', () => {
      render(<ImageRenderer src="image.png" alt="Descriptive text" />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Descriptive text');
    });

    it('should provide meaningful error message', () => {
      render(<ImageRenderer src="broken.png" alt="Important chart" />);

      const image = screen.getByRole('img');
      fireEvent.error(image);

      expect(screen.getByText(/Important chart/)).toBeInTheDocument();
    });
  });
});
