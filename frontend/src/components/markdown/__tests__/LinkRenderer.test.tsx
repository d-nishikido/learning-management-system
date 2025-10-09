import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { LinkRenderer } from '../LinkRenderer';

describe('LinkRenderer', () => {
  describe('外部リンク', () => {
    it('should add rel="noopener noreferrer" to http links', () => {
      render(<LinkRenderer href="http://example.com">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should add rel="noopener noreferrer" to https links', () => {
      render(<LinkRenderer href="https://example.com">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should apply external link styling', () => {
      render(<LinkRenderer href="https://example.com">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-blue-600', 'hover:text-blue-800', 'underline');
    });
  });

  describe('内部リンク', () => {
    it('should not add security attributes to relative links', () => {
      render(<LinkRenderer href="/page">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('rel');
      expect(link).not.toHaveAttribute('target');
    });

    it('should not add security attributes to anchor links', () => {
      render(<LinkRenderer href="#section">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('rel');
      expect(link).not.toHaveAttribute('target');
    });

    it('should apply internal link styling', () => {
      render(<LinkRenderer href="/page">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-blue-600', 'hover:text-blue-800', 'underline');
    });
  });

  describe('リンクコンテンツ', () => {
    it('should render text children correctly', () => {
      render(<LinkRenderer href="https://example.com">Click here</LinkRenderer>);

      expect(screen.getByText('Click here')).toBeInTheDocument();
    });

    it('should render complex children correctly', () => {
      render(
        <LinkRenderer href="https://example.com">
          <strong>Bold</strong> text
        </LinkRenderer>
      );

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText(/text/)).toBeInTheDocument();
    });
  });

  describe('href属性', () => {
    it('should preserve href attribute', () => {
      render(<LinkRenderer href="https://example.com/path">Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com/path');
    });

    it('should handle undefined href', () => {
      render(<LinkRenderer>Link</LinkRenderer>);

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('rel');
      expect(link).not.toHaveAttribute('target');
    });
  });
});
