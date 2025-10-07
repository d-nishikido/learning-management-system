import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface MarkdownHelpProps {
  /** 構文挿入時のコールバック */
  onInsertSyntax?: (syntax: string) => void;

  /** 追加のCSSクラス名 */
  className?: string;
}

interface SyntaxExample {
  title: string;
  syntax: string;
  description: string;
}

const syntaxExamples: Record<string, SyntaxExample[]> = {
  '見出し': [
    { title: '見出し1', syntax: '# 見出し1', description: '最上位の見出し' },
    { title: '見出し2', syntax: '## 見出し2', description: '2番目のレベルの見出し' },
    { title: '見出し3', syntax: '### 見出し3', description: '3番目のレベルの見出し' },
  ],
  'テキスト装飾': [
    { title: '太字', syntax: '**太字**', description: 'テキストを太字にする' },
    { title: '斜体', syntax: '*斜体*', description: 'テキストを斜体にする' },
    { title: '打ち消し線', syntax: '~~打ち消し線~~', description: 'テキストに打ち消し線を引く' },
    { title: 'インラインコード', syntax: '`コード`', description: '文中にコードを表示' },
  ],
  'リスト': [
    { title: '箇条書き', syntax: '- 項目1\n- 項目2\n- 項目3', description: '順序なしリスト' },
    { title: '番号付きリスト', syntax: '1. 項目1\n2. 項目2\n3. 項目3', description: '順序付きリスト' },
    { title: 'タスクリスト', syntax: '- [x] 完了したタスク\n- [ ] 未完了のタスク', description: 'チェックボックス付きリスト' },
  ],
  'リンクと画像': [
    { title: 'リンク', syntax: '[リンクテキスト](https://example.com)', description: 'ハイパーリンクを作成' },
    { title: '画像', syntax: '![代替テキスト](https://example.com/image.png)', description: '画像を挿入' },
  ],
  'コードブロック': [
    { title: 'コードブロック', syntax: '```javascript\nconst x = 1;\nconsole.log(x);\n```', description: 'シンタックスハイライト付きコード' },
    { title: 'プレーンコード', syntax: '```\nプレーンテキスト\n```', description: '言語指定なしのコード' },
  ],
  'テーブル': [
    {
      title: 'テーブル',
      syntax: '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| データ1 | データ2 | データ3 |',
      description: '表形式のデータ表示',
    },
  ],
  '引用': [
    { title: '引用', syntax: '> 引用文\n> 複数行の引用', description: '引用ブロックを作成' },
  ],
};

export const MarkdownHelp: React.FC<MarkdownHelpProps> = ({
  onInsertSyntax,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (syntax: string) => {
    if (onInsertSyntax) {
      onInsertSyntax(syntax);
    }
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {/* ヘルプボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="マークダウンヘルプを表示"
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        マークダウンヘルプ
      </button>

      {/* ヘルプモーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                マークダウン記法ヘルプ
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="閉じる"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-6">
                {Object.entries(syntaxExamples).map(([category, examples]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {examples.map((example, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-md hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-sm text-gray-900">
                                {example.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {example.description}
                              </div>
                            </div>
                            {onInsertSyntax && (
                              <button
                                type="button"
                                onClick={() => handleInsert(example.syntax)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap ml-2"
                              >
                                挿入
                              </button>
                            )}
                          </div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            <code>{example.syntax}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* フッター */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                各構文例の「挿入」ボタンをクリックすると、エディターに挿入できます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
