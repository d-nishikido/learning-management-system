import React, { useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 必要な言語のみをインポート（Light Buildで使用）
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';

// 言語登録の初期化フラグ
let languagesRegistered = false;

// 言語を登録する関数
const registerLanguages = () => {
  if (languagesRegistered) return;

  try {
    SyntaxHighlighter.registerLanguage('javascript', javascript);
    SyntaxHighlighter.registerLanguage('js', javascript);
    SyntaxHighlighter.registerLanguage('typescript', typescript);
    SyntaxHighlighter.registerLanguage('ts', typescript);
    SyntaxHighlighter.registerLanguage('python', python);
    SyntaxHighlighter.registerLanguage('py', python);
    SyntaxHighlighter.registerLanguage('java', java);
    SyntaxHighlighter.registerLanguage('cpp', cpp);
    SyntaxHighlighter.registerLanguage('c++', cpp);
    SyntaxHighlighter.registerLanguage('csharp', csharp);
    SyntaxHighlighter.registerLanguage('cs', csharp);
    SyntaxHighlighter.registerLanguage('go', go);
    SyntaxHighlighter.registerLanguage('golang', go);
    SyntaxHighlighter.registerLanguage('rust', rust);
    SyntaxHighlighter.registerLanguage('rs', rust);
    SyntaxHighlighter.registerLanguage('jsx', jsx);
    SyntaxHighlighter.registerLanguage('tsx', tsx);
    SyntaxHighlighter.registerLanguage('json', json);
    SyntaxHighlighter.registerLanguage('yaml', yaml);
    SyntaxHighlighter.registerLanguage('yml', yaml);
    SyntaxHighlighter.registerLanguage('markdown', markdown);
    SyntaxHighlighter.registerLanguage('md', markdown);
    SyntaxHighlighter.registerLanguage('bash', bash);
    SyntaxHighlighter.registerLanguage('sh', bash);
    SyntaxHighlighter.registerLanguage('shell', bash);
    SyntaxHighlighter.registerLanguage('sql', sql);

    languagesRegistered = true;
  } catch (error) {
    console.warn('Failed to register syntax highlighting languages:', error);
  }
};

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

export const CodeBlock: React.FC<CodeBlockProps> = React.memo(({
  children,
  className,
  inline,
  ...props
}) => {
  // 言語登録（初回のみ実行）
  useEffect(() => {
    registerLanguages();
  }, []);

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
});

CodeBlock.displayName = 'CodeBlock';
