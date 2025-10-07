import React, { useState } from 'react';

export interface ImageRendererProps {
  /** 画像URL */
  src?: string;

  /** 代替テキスト */
  alt?: string;

  /** 画像タイトル */
  title?: string;

  /** 追加のプロパティ */
  node?: unknown;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  src,
  alt,
  title,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // 画像読み込みエラー時のハンドラ
  const handleError = () => {
    setHasError(true);
  };

  // エラー時は代替UIを表示
  if (hasError) {
    return (
      <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-md text-gray-600">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>画像を読み込めませんでした: {alt || '画像'}</span>
      </div>
    );
  }

  // 正常時は画像を表示
  return (
    <img
      src={src}
      alt={alt || ''}
      title={title}
      onError={handleError}
      className="max-w-full h-auto rounded-md"
      {...props}
    />
  );
};
