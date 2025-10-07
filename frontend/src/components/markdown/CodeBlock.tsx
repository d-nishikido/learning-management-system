import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface CodeBlockProps {
  /** コード文字列 */
  children: string | string[];

  /** 言語識別子（例: "typescript", "python"） */
  className?: string; // 形式: "language-{lang}"

  /** インラインコードかブロックコードか */
  inline?: boolean;

  /** react-markdownから渡される追加のプロパティ */
  node?: unknown;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className,
  inline,
  ...props
}) => {
  // 言語識別子を抽出
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // コード文字列を取得
  const code = String(children).replace(/\n$/, '');

  // インラインコードの場合
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // ブロックコードの場合、シンタックスハイライトを適用
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language || 'text'}
      PreTag="div"
      className="rounded-md overflow-x-auto text-sm sm:text-base"
      customStyle={{
        margin: '1em 0',
        padding: '1em',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};
