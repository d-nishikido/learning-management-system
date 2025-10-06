# 技術スタック

## アーキテクチャ

### 全体構成
```
[フロントエンド (React Router v7)]
           ↕ HTTP/REST API
[バックエンドAPI (Node.js/Express)]
           ↕ SQL / Cache
[PostgreSQL] ← → [Redis]
```

### マイクロサービス構成（Docker）
- **frontend**: React Router v7アプリケーション（ポート3000）
- **backend**: Node.js/Express APIサーバー（ポート5000）
- **postgres**: PostgreSQLデータベース（ポート5432）
- **redis**: Redisキャッシュサーバー（ポート6379）

## フロントエンド技術

### コアフレームワーク
- **React Router v7** (v7.7.1): ルーティングとデータフェッチング
- **React** (v19.1.0): UIライブラリ
- **TypeScript** (v5.9.2): 型安全な開発

### UIとスタイリング
- **Tailwind CSS** (v3.4.17): ユーティリティファーストCSSフレームワーク
- **Lucide React** (v0.536.0): アイコンライブラリ
- **Recharts** (v3.1.2): データ可視化ライブラリ

### 国際化（i18n）
- **i18next** (v25.3.2): 国際化フレームワーク
- **react-i18next** (v15.6.1): React統合
- **i18next-browser-languagedetector** (v8.2.0): 自動言語検出
- **対応言語**: 日本語（ja）、英語（en）

### 状態管理・通信
- **Axios** (v1.11.0): HTTPクライアント

### ビルドツール
- **Vite** (v7.0.4): 高速ビルドツール
- **@vitejs/plugin-react** (v4.6.0): React統合プラグイン

## バックエンド技術

### コアフレームワーク
- **Node.js** (>=20.0.0): JavaScriptランタイム
- **Express** (v4.19.2): Webアプリケーションフレームワーク
- **TypeScript** (v5.5.4): 型安全な開発

### データベース・ORM
- **PostgreSQL** (v16-alpine): リレーショナルデータベース
- **Prisma** (v5.20.0): 次世代ORM
- **@prisma/client** (v5.20.0): Prismaクライアント

### キャッシュ・ジョブキュー
- **Redis** (v4.7.1): インメモリデータストア
- **Bull** (v4.16.5): Redisベースのジョブキュー

### 認証・セキュリティ
- **JWT**: jsonwebtoken (v9.0.2)
- **bcrypt** (v5.1.1): パスワードハッシュ化
- **helmet** (v7.1.0): セキュリティヘッダー設定
- **express-rate-limit** (v7.4.0): レート制限
- **cors** (v2.8.5): CORS設定

### バリデーション
- **express-validator** (v7.2.0): リクエストバリデーション
- **Joi** (v17.13.3): スキーマバリデーション

### ファイル処理
- **multer** (v1.4.5-lts.1): ファイルアップロード
- **sharp** (v0.34.3): 画像処理・最適化
- **fluent-ffmpeg** (v2.1.3): 動画処理

### ユーティリティ
- **winston** (v3.14.2): ロギング
- **compression** (v1.7.4): レスポンス圧縮
- **dotenv** (v16.4.5): 環境変数管理

## テスト環境

### ユニット・統合テスト
- **Jest** (v29.7.0): テストフレームワーク
- **ts-jest** (v29.2.5): TypeScript統合
- **Supertest** (v7.0.0): HTTPアサーション

### E2Eテスト
- **Playwright** (v1.48.0): ブラウザ自動化
- **対応ブラウザ**: Chromium, Firefox, WebKit

## 開発環境

### パッケージマネージャー
- **npm** (>=10.0.0): パッケージ管理
- **Workspaces**: モノレポ管理（frontend/backend）

### コード品質
- **ESLint** (v9.30.1): 静的解析
- **Prettier** (v3.6.2): コードフォーマット
- **TypeScript ESLint**: TypeScript用ESLintプラグイン

### 開発サーバー
- **ts-node-dev** (v2.0.0): Backend開発サーバー（ホットリロード）
- **Vite**: Frontend開発サーバー（HMR対応）
- **nodemon** (v3.1.10): ファイル監視・自動再起動

## Docker構成

### 開発環境
```yaml
Services:
  - frontend: port 3000
  - backend: port 5000
  - postgres: port 15432
  - redis: port 6379
```

### テスト環境
```yaml
Services:
  - frontend: port 3002
  - backend: port 3001
  - postgres: port 15433
  - redis: デフォルトポート使用
```

## 環境変数

### データベース設定
```bash
# Note: Use container internal port (5432) for Docker inter-container communication
DATABASE_URL=postgresql://lms_user:lms_password@postgres:5432/lms_db
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=lms_password
POSTGRES_DB=lms_db
POSTGRES_PORT=15432
```

### Redis設定
```bash
REDIS_URL=redis://redis:6379
REDIS_PORT=6379
```

### アプリケーション設定
```bash
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here_please_change_this
JWT_EXPIRES_IN=7d
```

### ポート設定
```bash
BACKEND_PORT=5000
BACKEND_HOST=0.0.0.0
FRONTEND_PORT=3000
```

### API設定
```bash
VITE_API_URL=http://localhost:5000/api/v1
CORS_ORIGIN=http://localhost:3000
```

### ファイルアップロード設定
```bash
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
```

### ロギング設定
```bash
LOG_LEVEL=debug
```

### ページネーション設定
```bash
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## よく使うコマンド

### プロジェクト全体
```bash
# E2Eテスト実行
npm run e2e                    # Chromiumのみ
npm run e2e:all               # 全ブラウザ
npm run e2e:ui                # UIモード
npm run e2e:debug             # デバッグモード

# Docker操作
npm run docker:up             # 開発環境起動
npm run docker:down           # 開発環境停止
npm run docker:test           # テスト環境起動
npm run docker:test:down      # テスト環境停止
npm run docker:cleanup        # Dockerクリーンアップ

# ポートチェック
npm run check-ports           # ポート利用状況確認
```

### バックエンド（backend/）
```bash
# 開発
npm run dev                   # 開発サーバー起動
npm run build                 # ビルド
npm start                     # プロダクションサーバー起動

# コード品質
npm run lint                  # リント
npm run lint:fix             # リント修正
npm run format                # フォーマット
npm run format:check          # フォーマットチェック

# データベース
npm run db:generate           # Prismaクライアント生成
npm run db:push               # スキーマプッシュ
npm run db:migrate            # マイグレーション実行
npm run db:seed               # シードデータ投入
npm run db:seed:e2e          # E2Eテスト用シード
npm run db:studio             # Prisma Studio起動

# テスト
npm test                      # テスト実行
npm run test:watch           # ウォッチモード
npm run test:coverage        # カバレッジ計測
```

### フロントエンド（frontend/）
```bash
# 開発
npm run dev                   # 開発サーバー起動（Vite）
npm start                     # 開発サーバー起動（別名）
npm run build                 # ビルド
npm run preview               # プレビューサーバー

# コード品質
npm run lint                  # リント
npm run lint:fix             # リント修正
npm run format                # フォーマット
npm run format:check          # フォーマットチェック
npm run typecheck             # 型チェック
```

## ポート管理

### 開発環境
- Frontend: 3000
- Backend: 5000
- PostgreSQL: 15432
- Redis: 6379

### テスト環境
- Frontend: 3002
- Backend: 3001
- PostgreSQL: 15433
- MCP: 3003

### ポート競合チェック
```bash
node scripts/check-ports.js development
node scripts/check-ports.js test
```

## アーキテクチャ上の重要な設計判断

### モノレポ構成
- npm workspacesによるフロントエンド・バックエンドの統合管理
- 共通の依存関係管理と効率的なビルドプロセス

### API設計
- RESTful API設計原則
- JWT認証によるステートレス認証
- ロールベースアクセス制御（RBAC）

### データベース設計
- Prisma ORMによる型安全なデータベースアクセス
- マイグレーション管理による変更履歴の追跡

### キャッシュ戦略
- Redis による頻繁にアクセスされるデータのキャッシュ
- Bullによる非同期ジョブ処理（動画変換、画像最適化等）

### ファイル処理
- Sharpによる画像最適化（WebP変換、リサイズ）
- FFmpegによる動画処理
- Multerによる安全なファイルアップロード

### セキュリティ
- Helmetによるセキュリティヘッダー設定
- CORS設定による適切なオリジン制限
- レート制限による DoS 攻撃対策
- bcryptによる安全なパスワードハッシュ化

### 国際化（i18n）
- i18next による多言語対応
- ブラウザ言語自動検出
- 翻訳リソースの動的ロード
