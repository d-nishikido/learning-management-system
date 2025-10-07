import React, { useState, useRef } from 'react';
import { MarkdownViewer } from './MarkdownViewer';
import { MarkdownHelp } from './MarkdownHelp';

export interface MarkdownEditorProps {
  /** エディターの値 */
  value: string;

  /** 値変更時のコールバック */
  onChange: (value: string) => void;

  /** プレースホルダーテキスト */
  placeholder?: string;

  /** エディターの高さ */
  height?: string;

  /** エラーメッセージ */
  error?: string;

  /** 無効化フラグ */
  disabled?: boolean;

  /** 追加のCSSクラス名 */
  className?: string;

  /** ラベルテキスト */
  label?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'マークダウンを入力してください...',
  height = '400px',
  error,
  disabled = false,
  className = '',
  label,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleInsertSyntax = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value;

    // カーソル位置に構文を挿入
    const newValue =
      currentValue.substring(0, start) +
      syntax +
      currentValue.substring(end);

    onChange(newValue);

    // 挿入後、カーソル位置を調整
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + syntax.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* ラベルとヘルプボタン */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <MarkdownHelp onInsertSyntax={handleInsertSyntax} />
      </div>

      {/* モバイル用タブ切り替え */}
      <div className="flex md:hidden border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'edit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          プレビュー
        </button>
      </div>

      {/* エディターエリア */}
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        {/* 編集エリア */}
        <div
          className={`flex-1 ${activeTab === 'preview' ? 'hidden md:block' : ''}`}
        >
          <div className="flex flex-col">
            <div className="hidden md:block text-sm font-medium text-gray-700 mb-2">
              マークダウン編集
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error
                  ? 'border-red-500'
                  : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              style={{ height }}
            />
          </div>
        </div>

        {/* プレビューエリア */}
        <div
          className={`flex-1 ${activeTab === 'edit' ? 'hidden md:block' : ''}`}
        >
          <div className="flex flex-col">
            <div className="hidden md:block text-sm font-medium text-gray-700 mb-2">
              プレビュー
            </div>
            <div
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white overflow-y-auto"
              style={{ height }}
            >
              <MarkdownViewer
                content={value}
                fallbackContent={
                  <div className="text-gray-400 text-sm">
                    プレビューがここに表示されます
                  </div>
                }
                ariaLabel="マークダウンプレビュー"
              />
            </div>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};
