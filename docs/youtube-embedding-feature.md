# YouTube動画埋め込み機能

## 概要
学習管理システム（LMS）では、YouTube動画URLを学習教材として追加した際に、自動的に埋め込み形式で表示する機能が実装されています。

## 実装済み機能

### 1. YouTube URL検出
- `frontend/src/components/materials/MaterialViewer.tsx` の `getYouTubeEmbedUrl` 関数
- 対応URL形式：
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - パラメータ付きURL（`&t=42s&list=...` など）も正常に処理

### 2. 埋め込み表示機能
- materialType が 'URL' でYouTube URLの場合、自動的にiframe埋め込み表示
- フルスクリーン対応
- セキュリティ属性設定済み（accelerometer, autoplay, encrypted-media等）
- レスポンシブデザイン（`w-full h-[500px]`）

### 3. 非YouTube URLの処理
- YouTube以外の外部URLは通常のiframe埋め込み
- セキュリティ警告表示
- サンドボックス制限付きiframe
- 新しいタブで開くリンク提供

## 使用方法

### 管理者側
1. 学習教材作成時に `materialType: 'URL'` を選択
2. `externalUrl` フィールドにYouTube URLを入力
3. 教材を保存・公開

### 学習者側
1. レッスン詳細ページで教材をクリック
2. MaterialViewerモーダルが開く
3. YouTube動画が自動的に埋め込み形式で表示
4. フルスクリーン再生可能

## 技術実装詳細

### URL変換ロジック
```javascript
const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};
```

### iframe設定
```jsx
<iframe
  src={youtubeEmbedUrl}
  className="w-full h-[500px] border-0"
  title={material.title}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

## テスト

### 単体テスト
- `MaterialViewer.test.tsx` にて包括的なテストスイートを実装
- YouTube URL検出テスト
- 埋め込み表示テスト
- 非YouTube URLの処理テスト
- エラーハンドリングテスト

### テスト対象URL
- 標準YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- 短縮URL: `https://youtu.be/dQw4w9WgXcQ`
- パラメータ付きURL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s`

## 既知の制限事項
- YouTube Premium限定動画は埋め込み制限により表示されない場合があります
- 地域制限のある動画は表示されない場合があります
- 埋め込み無効設定の動画は表示されません

## セキュリティ考慮事項
- YouTube埋め込みは信頼できるドメインからのみ
- 非YouTube URLはサンドボックス制限付き
- XSS攻撃対策として適切なCSP設定

## 結論
GitHub Issue #110「YouTube動画埋め込み」の要求機能は完全に実装済みです。追加の開発作業は不要で、現在の実装は安定して動作しています。