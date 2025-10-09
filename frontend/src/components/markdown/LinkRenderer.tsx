import React from 'react';

export interface LinkRendererProps {
  /** リンクURL */
  href?: string;

  /** リンクテキスト */
  children: React.ReactNode;

  /** 追加のプロパティ */
  node?: unknown;
}

export const LinkRenderer: React.FC<LinkRendererProps> = ({
  href,
  children,
  ...props
}) => {
  // 外部リンクかどうかを判定
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://');

  // 外部リンクの場合はセキュリティ属性を追加
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
        {...props}
      >
        {children}
      </a>
    );
  }

  // 内部リンクの場合はそのまま表示
  return (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 underline"
      {...props}
    >
      {children}
    </a>
  );
};
