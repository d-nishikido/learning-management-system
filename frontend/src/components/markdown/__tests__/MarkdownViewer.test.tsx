import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { MarkdownViewer } from '../MarkdownViewer';

describe('MarkdownViewer', () => {
  describe('基本的なマークダウンレンダリング', () => {
    it('should render markdown headings correctly', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      render(<MarkdownViewer content={markdown} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading 1');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Heading 2');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heading 3');
    });

    it('should render lists correctly', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      render(<MarkdownViewer content={markdown} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
      expect(listItems[0]).toHaveTextContent('Item 1');
      expect(listItems[1]).toHaveTextContent('Item 2');
      expect(listItems[2]).toHaveTextContent('Item 3');
    });

    it('should render links correctly', () => {
      const markdown = '[Link text](https://example.com)';
      render(<MarkdownViewer content={markdown} />);

      const link = screen.getByRole('link');
      expect(link).toHaveTextContent('Link text');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should render images correctly', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      render(<MarkdownViewer content={markdown} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Alt text');
      expect(image).toHaveAttribute('src', 'https://example.com/image.png');
    });

    it('should render code blocks correctly', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      render(<MarkdownViewer content={markdown} />);

      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });

    it('should render inline code correctly', () => {
      const markdown = 'This is `inline code` text.';
      render(<MarkdownViewer content={markdown} />);

      expect(screen.getByText('inline code')).toBeInTheDocument();
    });
  });

  describe('GitHub Flavored Markdown (GFM)', () => {
    it('should render tables correctly', () => {
      const markdown = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
      render(<MarkdownViewer content={markdown} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });

    it('should render strikethrough correctly', () => {
      const markdown = '~~strikethrough text~~';
      render(<MarkdownViewer content={markdown} />);

      const strikethrough = screen.getByText('strikethrough text');
      expect(strikethrough.tagName.toLowerCase()).toBe('del');
    });

    it('should render task lists correctly', () => {
      const markdown = '- [x] Completed task\n- [ ] Incomplete task';
      render(<MarkdownViewer content={markdown} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe('XSSサニタイゼーション', () => {
    it('should sanitize script tags', () => {
      const markdown = '<script>alert("XSS")</script>';
      const { container } = render(<MarkdownViewer content={markdown} />);

      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('should sanitize onerror attributes', () => {
      const markdown = '<img src="x" onerror="alert(\'XSS\')" />';
      const { container } = render(<MarkdownViewer content={markdown} />);

      const img = container.querySelector('img');
      expect(img).not.toHaveAttribute('onerror');
    });

    it('should sanitize onclick attributes', () => {
      const markdown = '<a href="#" onclick="alert(\'XSS\')">Link</a>';
      const { container } = render(<MarkdownViewer content={markdown} />);

      const link = container.querySelector('a');
      expect(link).not.toHaveAttribute('onclick');
    });

    it('should sanitize javascript: protocol', () => {
      const markdown = '[Click me](javascript:alert("XSS"))';
      render(<MarkdownViewer content={markdown} />);

      const link = screen.queryByRole('link');
      if (link) {
        expect(link.getAttribute('href')).not.toContain('javascript:');
      }
    });
  });

  describe('外部リンクのセキュリティ', () => {
    it('should add rel="noopener noreferrer" to external links', () => {
      const markdown = '[External](https://example.com)';
      render(<MarkdownViewer content={markdown} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not add rel="noopener noreferrer" to internal links', () => {
      const markdown = '[Internal](/page)';
      render(<MarkdownViewer content={markdown} />);

      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).not.toHaveAttribute('target', '_blank');
    });
  });

  describe('空コンテンツハンドリング', () => {
    it('should display fallback content when content is empty', () => {
      const fallback = <div>No content available</div>;
      render(<MarkdownViewer content="" fallbackContent={fallback} />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('should display fallback content when content is only whitespace', () => {
      const fallback = <div>No content available</div>;
      render(<MarkdownViewer content="   \n  \t  " fallbackContent={fallback} />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('should not display fallback when content exists', () => {
      const fallback = <div>No content available</div>;
      render(<MarkdownViewer content="# Hello" fallbackContent={fallback} />);

      expect(screen.queryByText('No content available')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello');
    });
  });

  describe('アクセシビリティ', () => {
    it('should apply aria-label when provided', () => {
      const { container } = render(
        <MarkdownViewer content="# Test" ariaLabel="Test content" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveAttribute('aria-label', 'Test content');
    });

    it('should preserve alt attributes on images', () => {
      const markdown = '![Important image](image.png)';
      render(<MarkdownViewer content={markdown} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Important image');
    });
  });

  describe('CSSクラス', () => {
    it('should apply prose and max-w-none classes by default', () => {
      const { container } = render(<MarkdownViewer content="# Test" />);

      const markdown = container.querySelector('.prose.max-w-none');
      expect(markdown).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <MarkdownViewer content="# Test" className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
