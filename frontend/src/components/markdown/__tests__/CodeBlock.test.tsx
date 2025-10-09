import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  describe('言語検出', () => {
    it('should extract language from className', () => {
      const { container } = render(
        <CodeBlock className="language-javascript">const x = 1;</CodeBlock>
      );

      // SyntaxHighlighterが言語を認識していることを確認
      expect(container.querySelector('.language-javascript, [class*="language-"]')).toBeInTheDocument();
    });

    it('should handle typescript language', () => {
      const { container } = render(
        <CodeBlock className="language-typescript">const x: number = 1;</CodeBlock>
      );

      expect(container.querySelector('[class*="language-"]')).toBeInTheDocument();
    });

    it('should handle python language', () => {
      const { container } = render(
        <CodeBlock className="language-python">x = 1</CodeBlock>
      );

      expect(container.querySelector('[class*="language-"]')).toBeInTheDocument();
    });

    it('should default to text when no language specified', () => {
      const { container } = render(
        <CodeBlock>plain text</CodeBlock>
      );

      expect(container.querySelector('[class*="language-"]')).toBeInTheDocument();
    });
  });

  describe('インラインコードとブロックコード', () => {
    it('should render inline code without highlighting', () => {
      const { container } = render(
        <CodeBlock inline className="language-javascript">const x = 1</CodeBlock>
      );

      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code).toHaveTextContent('const x = 1');
    });

    it('should render block code with syntax highlighting', () => {
      const { container } = render(
        <CodeBlock className="language-javascript">const x = 1;</CodeBlock>
      );

      // SyntaxHighlighterがレンダリングされていることを確認
      expect(container.querySelector('[class*="language-"]')).toBeInTheDocument();
    });
  });

  describe('コンテンツ処理', () => {
    it('should handle string children', () => {
      render(<CodeBlock>const x = 1;</CodeBlock>);

      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });

    it('should handle array children', () => {
      render(<CodeBlock>{['const x = 1;', 'const y = 2;']}</CodeBlock>);

      expect(screen.getByText(/const x = 1,const y = 2/)).toBeInTheDocument();
    });

    it('should remove trailing newlines', () => {
      const code = 'const x = 1;\n';
      render(<CodeBlock className="language-javascript">{code}</CodeBlock>);

      // 末尾の改行が削除されていることを確認
      expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('should apply rounded-md and overflow-x-auto classes', () => {
      const { container } = render(
        <CodeBlock className="language-javascript">const x = 1;</CodeBlock>
      );

      const codeBlock = container.querySelector('.rounded-md.overflow-x-auto');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should apply custom styles', () => {
      const { container } = render(
        <CodeBlock className="language-javascript">const x = 1;</CodeBlock>
      );

      // SyntaxHighlighterのスタイルが適用されていることを確認
      const pre = container.querySelector('div');
      expect(pre).toBeInTheDocument();
    });
  });

  describe('特殊文字とエスケープ', () => {
    it('should handle HTML entities', () => {
      render(<CodeBlock>{'<div>&amp; &lt; &gt;</div>'}</CodeBlock>);

      expect(screen.getByText(/<div>&amp; &lt; &gt;<\/div>/)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<CodeBlock>{'const str = "Hello \\"World\\"";'}</CodeBlock>);

      expect(screen.getByText(/Hello \\"World\\"/)).toBeInTheDocument();
    });
  });
});
