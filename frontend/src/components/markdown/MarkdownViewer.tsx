import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock';
import { LinkRenderer } from './LinkRenderer';
import { ImageRenderer } from './ImageRenderer';

export interface MarkdownViewerProps {
  /** レンダリングするマークダウンコンテンツ */
  content: string;

  /** 空コンテンツ時のフォールバック表示 */
  fallbackContent?: React.ReactNode;

  /** 追加のCSSクラス名 */
  className?: string;

  /** アクセシビリティ用のARIAラベル */
  ariaLabel?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(({
  content,
  fallbackContent,
  className = '',
  ariaLabel
}) => {
  // 空コンテンツの場合はフォールバックを表示
  if (!content || content.trim() === '') {
    return <>{fallbackContent}</>;
  }

  // レンダリング結果をメモ化
  const renderedContent = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      className={`prose max-w-none ${className}`}
      components={{
        code: CodeBlock,
        a: LinkRenderer,
        img: ImageRenderer,
      }}
    >
      {content}
    </ReactMarkdown>
  ), [content, className]);

  return (
    <div
      className={`${className} prose-img:max-w-full prose-table:overflow-x-auto prose-table:block prose-table:whitespace-nowrap sm:prose-table:whitespace-normal`}
      aria-label={ariaLabel}
    >
      {renderedContent}
    </div>
  );
});

MarkdownViewer.displayName = 'MarkdownViewer';
