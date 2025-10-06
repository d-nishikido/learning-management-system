# プロジェクト構造

## ルートディレクトリ構成

```
learning-management-system/
├── .claude/              # Claude Code設定（エージェント、コマンド）
├── .kiro/               # Kiro仕様駆動開発（ステアリング、仕様）
├── .serena/             # Serenaプロジェクトメモリ
├── backend/             # バックエンドアプリケーション
├── frontend/            # フロントエンドアプリケーション
├── docker/              # Docker設定ファイル
├── docs/                # プロジェクトドキュメント
├── e2e/                 # E2Eテスト
├── scripts/             # ユーティリティスクリプト
├── reviews/             # コードレビュー記録
├── claudedocs/          # Claude生成ドキュメント
├── test-results/        # テスト結果
├── docker-compose.yml   # Docker Compose設定（開発環境）
├── docker-compose.test.yml  # Docker Compose設定（テスト環境）
├── playwright.config.ts # Playwright設定
└── package.json         # ルートパッケージ設定（workspaces）
```

### ディレクトリの役割

#### 開発・設定関連
- **`.claude/`**: Claude Code用のカスタムコマンドとエージェント定義
- **`.kiro/`**: 仕様駆動開発のステアリングドキュメントと機能仕様
- **`.serena/`**: Serena MCPサーバーのプロジェクトメモリ
- **`scripts/`**: ポートチェック、Docker管理などのユーティリティスクリプト

#### アプリケーション
- **`backend/`**: Node.js/Express APIサーバー
- **`frontend/`**: React Router v7 Webアプリケーション
- **`e2e/`**: Playwright E2Eテスト

#### インフラ・設定
- **`docker/`**: Dockerfile、初期化スクリプト等のDocker関連ファイル

#### ドキュメント・レビュー
- **`docs/`**: システム設計書、API仕様書、テーブル定義書
- **`reviews/`**: コードレビュー記録（issue別、feature別）
- **`claudedocs/`**: Claude Code生成の分析レポート
- **`test-results/`**: Playwright テスト結果とスクリーンショット

## バックエンド構造（backend/）

```
backend/
├── src/
│   ├── controllers/      # リクエストハンドラ（ビジネスロジック呼び出し）
│   ├── services/         # ビジネスロジック層
│   ├── middleware/       # Express ミドルウェア
│   ├── routes/           # APIルート定義
│   ├── schemas/          # バリデーションスキーマ（Joi）
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ関数
│   ├── __tests__/        # テストファイル
│   └── app.ts            # アプリケーションエントリーポイント
├── prisma/
│   ├── schema.prisma     # Prismaスキーマ定義
│   ├── seed.ts           # 開発用シードデータ
│   └── seed-e2e.ts       # E2Eテスト用シードデータ
├── dist/                 # ビルド出力
├── uploads/              # アップロードファイル保存先
├── coverage/             # テストカバレッジレポート
├── Dockerfile            # Dockerイメージ定義
├── package.json          # 依存関係とスクリプト
├── tsconfig.json         # TypeScript設定
└── jest.config.js        # Jest設定
```

### バックエンド主要ディレクトリ

#### `controllers/`
リクエスト処理とレスポンス返却を担当。サービス層を呼び出してビジネスロジックを実行。

- `authController.ts`: 認証関連（ログイン、登録）
- `userController.ts`: ユーザー管理
- `courseController.ts`: コース管理
- `lessonController.ts`: レッスン管理
- `learningMaterialController.ts`: 学習教材管理
- `learningResourceController.ts`: 学習リソース管理
- `progressController.ts`: 進捗管理
- `testController.ts`: テスト管理
- `questionController.ts`: 問題管理
- `learningHistoryController.ts`: 学習履歴

#### `services/`
ビジネスロジックとデータベースアクセスを担当。

- `userService.ts`: ユーザー操作
- `courseService.ts`: コース操作
- `lessonService.ts`: レッスン操作
- `learningMaterialService.ts`: 教材操作
- `learningResourceService.ts`: リソース操作
- `progressService.ts`: 進捗計算・更新
- `testService.ts`: テスト操作
- `questionService.ts`: 問題操作
- `jwtService.ts`: JWT生成・検証
- `passwordService.ts`: パスワードハッシュ化
- `imageProcessingService.ts`: 画像処理（Sharp）
- `videoProcessingService.ts`: 動画処理（FFmpeg）
- `timeTrackingService.ts`: 学習時間追跡
- `learningHistoryService.ts`: 履歴管理

#### `middleware/`
リクエスト処理のミドルウェア。

- `auth.ts`: JWT認証・認可
- `errorHandler.ts`: エラーハンドリング
- `validation.ts`: リクエストバリデーション
- `validateRequest.ts`: express-validator統合
- `upload.ts`: ファイルアップロード（Multer）
- `fileValidation.ts`: ファイルバリデーション
- `fileOptimization.ts`: ファイル最適化
- `localizedValidation.ts`: 国際化対応バリデーション

#### `routes/`
APIエンドポイント定義。

- `index.ts`: ルートエクスポート
- `auth.ts`: `/api/v1/auth` - 認証
- `users.ts`: `/api/v1/users` - ユーザー
- `courses.ts`: `/api/v1/courses` - コース
- `lessons.ts`: `/api/v1/lessons` - レッスン
- `materials.ts`: `/api/v1/materials` - 教材
- `resources.ts`: `/api/v1/resources` - リソース
- `progress.ts`: `/api/v1/progress` - 進捗
- `tests.ts`: `/api/v1/tests` - テスト
- `questions.ts`: `/api/v1/questions` - 問題
- `learningHistory.ts`: `/api/v1/learning-history` - 学習履歴
- `health.ts`: `/api/v1/health` - ヘルスチェック

#### `schemas/`
バリデーションスキーマ（Joi）。

- `testSchemas.ts`: テスト関連スキーマ
- `localizedTestSchemas.ts`: 国際化対応テストスキーマ

#### `types/`
TypeScript型定義。

- `index.ts`: 共通型定義（UserRole, MaterialType, TestType等）

#### `utils/`
ユーティリティ関数。

- `errors.ts`: カスタムエラークラス（NotFoundError, ValidationError等）
- `logger.ts`: Winston ロガー設定
- `i18n.ts`: 国際化ユーティリティ
- `localizedErrors.ts`: 国際化対応エラーメッセージ

## フロントエンド構造（frontend/）

```
frontend/
├── src/
│   ├── components/       # Reactコンポーネント
│   │   ├── common/       # 共通コンポーネント
│   │   ├── course/       # コース関連
│   │   ├── lesson/       # レッスン関連
│   │   ├── material/     # 教材関連
│   │   ├── progress/     # 進捗関連
│   │   ├── auth/         # 認証関連
│   │   └── layout/       # レイアウト
│   ├── pages/            # ページコンポーネント
│   ├── contexts/         # React Context
│   ├── services/         # APIクライアント
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ関数
│   ├── i18n/             # 国際化設定
│   ├── assets/           # 静的アセット
│   ├── App.tsx           # ルートコンポーネント
│   ├── main.tsx          # エントリーポイント
│   └── index.css         # グローバルスタイル
├── public/               # 公開アセット
├── dist/                 # ビルド出力
├── Dockerfile            # Dockerイメージ定義
├── package.json          # 依存関係とスクリプト
├── tsconfig.json         # TypeScript設定
├── vite.config.ts        # Vite設定
├── tailwind.config.js    # Tailwind CSS設定
└── postcss.config.js     # PostCSS設定
```

### フロントエンド主要ディレクトリ

#### `components/`
再利用可能なUIコンポーネント。機能別にサブディレクトリを分類。

**`common/`**: 汎用コンポーネント
- `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Loading.tsx`
- `Card.tsx`, `Badge.tsx`, `Alert.tsx`
- `LanguageSwitcher.tsx`: 言語切り替え

**`layout/`**: レイアウトコンポーネント
- `Header.tsx`, `Footer.tsx`, `Sidebar.tsx`, `Navigation.tsx`

**機能別コンポーネント**:
- `auth/`: LoginForm, RegisterForm
- `course/`: CourseCard, CourseList, CourseDetail
- `lesson/`: LessonCard, LessonList, LessonContent
- `material/`: MaterialViewer, MaterialList, MaterialUpload
- `progress/`: ProgressBar, ProgressChart, ProgressDashboard

#### `pages/`
ルートに対応するページコンポーネント。

- `HomePage.tsx`: トップページ
- `CoursesPage.tsx`: コース一覧
- `CourseDetailPage.tsx`: コース詳細
- `LessonPage.tsx`: レッスンページ
- `ProgressPage.tsx`: 進捗ページ
- `LoginPage.tsx`: ログイン
- `RegisterPage.tsx`: 登録

#### `services/`
APIクライアント（Axios）。

- `api.ts`: Axios インスタンス設定
- `authService.ts`: 認証API
- `courseService.ts`: コースAPI
- `lessonService.ts`: レッスンAPI
- `materialService.ts`: 教材API
- `progressService.ts`: 進捗API

#### `contexts/`
React Context（グローバル状態）。

- `AuthContext.tsx`: 認証状態管理
- `ThemeContext.tsx`: テーマ管理（ダーク/ライトモード）
- `LanguageContext.tsx`: 言語設定

#### `i18n/`
国際化設定とリソース。

- `config.ts`: i18next 設定
- `locales/ja/`: 日本語翻訳リソース
- `locales/en/`: 英語翻訳リソース

#### `types/`
TypeScript型定義。

- `index.ts`: グローバル型定義
- `api.ts`: APIレスポンス型
- `models.ts`: データモデル型

#### `utils/`
ユーティリティ関数。

- `formatters.ts`: データフォーマット
- `validators.ts`: バリデーション
- `constants.ts`: 定数定義
- `helpers.ts`: ヘルパー関数

## ファイル命名規則

### バックエンド
- **コントローラー**: `{entity}Controller.ts` (例: `userController.ts`)
- **サービス**: `{entity}Service.ts` (例: `userService.ts`)
- **ルート**: `{entity}.ts` (例: `users.ts`)
- **ミドルウェア**: `{function}.ts` (例: `auth.ts`)
- **型定義**: `index.ts` または `{domain}.ts`
- **テスト**: `{target}.test.ts` (例: `userService.test.ts`)

### フロントエンド
- **コンポーネント**: PascalCase (例: `CourseCard.tsx`, `ProgressBar.tsx`)
- **ページ**: PascalCase + Page (例: `HomePage.tsx`, `CoursesPage.tsx`)
- **サービス**: camelCase + Service (例: `authService.ts`, `courseService.ts`)
- **ユーティリティ**: camelCase (例: `formatters.ts`, `validators.ts`)
- **Context**: PascalCase + Context (例: `AuthContext.tsx`)
- **型定義**: camelCase (例: `index.ts`, `api.ts`)

### データベース
- **テーブル名**: PascalCase単数形 (例: `User`, `Course`, `LearningMaterial`)
- **フィールド名**: camelCase (例: `userId`, `createdAt`, `isActive`)

### API URL
- **エンドポイント**: kebab-case (例: `/api/v1/learning-history`, `/api/v1/user-progress`)

## コード組織パターン

### バックエンドアーキテクチャ（3層構造）

```
Controller → Service → Database (Prisma)
     ↓          ↓
 Validation  Business Logic
```

1. **Controller層**: リクエスト受信、バリデーション、レスポンス返却
2. **Service層**: ビジネスロジック、データ操作
3. **Database層**: Prisma経由のデータアクセス

### エラーハンドリング

**カスタムエラークラス**:
```typescript
// utils/errors.ts
export class NotFoundError extends Error
export class ValidationError extends Error
export class UnauthorizedError extends Error
export class ConflictError extends Error
```

**エラーミドルウェア**:
```typescript
// middleware/errorHandler.ts
app.use(errorHandler); // 全エラーをキャッチして統一レスポンス
```

### レスポンス形式

```typescript
// 成功レスポンス
{
  status: 'success',
  data: { ... },
  message?: string
}

// エラーレスポンス
{
  status: 'error',
  message: string,
  errors?: ValidationError[]
}
```

## インポート組織

### バックエンド
```typescript
// 外部ライブラリ
import express from 'express';
import { PrismaClient } from '@prisma/client';

// 内部モジュール（相対パス）
import { UserService } from '../services/userService';
import { authMiddleware } from '../middleware/auth';
import type { ApiResponse } from '../types';
```

### フロントエンド
```typescript
// 外部ライブラリ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 内部モジュール
import { Button } from '@/components/common/Button';
import { authService } from '@/services/authService';
import type { User } from '@/types';

// スタイル
import './styles.css';
```

**エイリアス設定**:
- `@/` → `src/` (Vite設定で定義)

## アーキテクチャ原則

### バックエンド設計原則

1. **関心の分離**: Controller-Service-Repositoryパターン
2. **依存性注入**: サービスはコンストラクタインジェクション（将来的に）
3. **型安全性**: TypeScript strict mode、Prisma型生成
4. **エラー処理**: 中央集約エラーハンドリング
5. **バリデーション**: リクエストレベル（express-validator）とスキーマレベル（Joi）

### フロントエンド設計原則

1. **コンポーネント分割**: 小さく再利用可能なコンポーネント
2. **状態管理**: Context API（認証、テーマ、言語）
3. **型安全性**: TypeScript strict mode
4. **スタイリング**: Tailwind CSS ユーティリティクラス
5. **国際化**: i18next による多言語対応

### データベース設計原則

1. **正規化**: 適切な正規化とリレーション設計
2. **インデックス**: パフォーマンス最適化のためのインデックス設定
3. **マイグレーション**: Prisma Migrateによる変更管理
4. **シード**: 開発用とE2E用の分離されたシードデータ

## テスト構造

### バックエンドテスト
```
backend/src/__tests__/
├── setup.ts              # テスト環境セットアップ
├── helpers/
│   ├── fixtures.ts       # テストデータ
│   └── apiHelpers.ts     # APIテストヘルパー
├── unit/                 # ユニットテスト
├── integration/          # 統合テスト
└── e2e/                  # API E2Eテスト
```

### E2Eテスト
```
e2e/
├── tests/
│   ├── auth.spec.ts           # 認証フロー
│   ├── courses.spec.ts        # コース管理
│   ├── lessons.spec.ts        # レッスン
│   ├── progress.spec.ts       # 進捗管理
│   └── learning-history.spec.ts
├── fixtures/                   # テストデータ
└── utils/                      # テストユーティリティ
```

## 開発ワークフロー

### 機能開発フロー
1. **仕様作成**: `.kiro/specs/` に機能仕様作成
2. **設計**: 要件、設計、タスク定義
3. **実装**: TDD（Test-Driven Development）で実装
4. **テスト**: ユニット→統合→E2E
5. **レビュー**: `reviews/` にレビュー記録
6. **マージ**: main ブランチへマージ

### Git ブランチ戦略
- `main`: 本番ブランチ
- `feature/{issue-number}`: 機能開発ブランチ
- `bugfix/{issue-number}`: バグ修正ブランチ
