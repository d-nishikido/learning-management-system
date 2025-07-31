# 学習管理システム（LMS）API仕様書

## 目次
1. [概要](#1-概要)
2. [認証・認可](#2-認証認可)
3. [共通仕様](#3-共通仕様)
4. [エラーハンドリング](#4-エラーハンドリング)
5. [ユーザー管理API](#5-ユーザー管理api)
6. [学習コンテンツ管理API](#6-学習コンテンツ管理api)
7. [進捗管理API](#7-進捗管理api)
8. [テスト・問題管理API](#8-テスト問題管理api)
9. [Q&A・ナレッジ管理API](#9-qaナレッジ管理api)
10. [ゲーミフィケーションAPI](#10-ゲーミフィケーションapi)
11. [コミュニケーションAPI](#11-コミュニケーションapi)
12. [システム管理API](#12-システム管理api)

---

## 1. 概要

### 1.1 基本情報
- **API名**: LMS API
- **バージョン**: v1
- **ベースURL**: `https://api.lms.example.com/api/v1`
- **プロトコル**: HTTPS
- **データ形式**: JSON

### 1.2 技術スタック
- **フレームワーク**: Node.js + Express
- **ORM**: Prisma
- **データベース**: PostgreSQL
- **認証**: JWT (Bearer Token)

---

## 2. 認証・認可

### 2.1 認証方式
JWT (JSON Web Token) を使用したBearer認証

#### リクエストヘッダー
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 2.2 認証エンドポイント

#### ログイン
```http
POST /auth/login
```

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "profileImageUrl": "https://example.com/avatar.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### ログアウト
```http
POST /auth/logout
```

#### トークン更新
```http
POST /auth/refresh
```

#### パスワードリセット
```http
POST /auth/forgot-password
```

```http
POST /auth/reset-password
```

### 2.3 ロールベースアクセス制御（RBAC）
- **user**: 一般ユーザー（学習者）
- **admin**: 管理者（教育者・システム管理者）

---

## 3. 共通仕様

### 3.1 レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": { /* レスポンスデータ */ },
  "message": "操作が成功しました",
  "timestamp": "2025-01-31T10:00:00Z"
}
```

#### ページネーション付きレスポンス
```json
{
  "success": true,
  "data": {
    "items": [ /* データ配列 */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3.2 共通クエリパラメータ

#### ページネーション
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20、最大: 100）

#### ソート
- `sortBy`: ソート対象フィールド
- `sortOrder`: ソート順序（`asc` | `desc`）

#### フィルタリング
- `search`: 検索キーワード
- `filter[field]`: フィールド別フィルタ

### 3.3 ファイルアップロード
- **最大ファイルサイズ**: 10MB
- **対応形式**: PDF, MP4, WebM, MP3, JPEG, PNG, ZIP等
- **エンドポイント**: `POST /files/upload`

---

## 4. エラーハンドリング

### 4.1 エラーレスポンス形式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "timestamp": "2025-01-31T10:00:00Z"
}
```

### 4.2 HTTPステータスコード
- `200`: 成功
- `201`: 作成成功
- `204`: 削除成功
- `400`: リクエストエラー
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソース未発見
- `409`: 競合エラー
- `422`: バリデーションエラー
- `500`: サーバーエラー

---

## 5. ユーザー管理API

### 5.1 ユーザー情報取得

#### 自分の情報取得
```http
GET /users/me
```

#### ユーザー詳細取得
```http
GET /users/{id}
```

#### ユーザー一覧取得（管理者のみ）
```http
GET /users?page=1&limit=20&search=john&filter[role]=user
```

### 5.2 ユーザー作成・更新

#### ユーザー作成（管理者のみ）
```http
POST /users
```

**リクエストボディ:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "bio": "学習中のプログラマーです"
}
```

#### プロフィール更新
```http
PUT /users/me
```

#### パスワード変更
```http
PUT /users/me/password
```

### 5.3 ユーザー管理

#### ユーザー無効化（管理者のみ）
```http
PUT /users/{id}/deactivate
```

#### ユーザー削除（管理者のみ）
```http
DELETE /users/{id}
```

---

## 6. 学習コンテンツ管理API

### 6.1 コース管理

#### コース一覧取得
```http
GET /courses?category=programming&difficulty=beginner&isPublished=true
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "JavaScript基礎",
        "description": "JavaScriptの基本概念を学習します",
        "category": "programming",
        "difficultyLevel": "beginner",
        "estimatedHours": 20,
        "thumbnailUrl": "https://example.com/thumb.jpg",
        "isPublished": true,
        "lessonsCount": 15,
        "enrolledCount": 42,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### コース詳細取得
```http
GET /courses/{id}
```

#### コース作成（管理者のみ）
```http
POST /courses
```

#### コース更新（管理者のみ）
```http
PUT /courses/{id}
```

#### コース削除（管理者のみ）
```http
DELETE /courses/{id}
```

### 6.2 レッスン管理

#### レッスン一覧取得
```http
GET /courses/{courseId}/lessons
```

#### レッスン詳細取得
```http
GET /lessons/{id}
```

#### レッスン作成（管理者のみ）
```http
POST /courses/{courseId}/lessons
```

#### レッスン更新（管理者のみ）
```http
PUT /lessons/{id}
```

### 6.3 学習教材管理

#### 教材一覧取得
```http
GET /lessons/{lessonId}/materials
```

#### 教材詳細取得
```http
GET /materials/{id}
```

#### 教材作成（管理者のみ）
```http
POST /lessons/{lessonId}/materials
```

**リクエストボディ例（ファイル型教材）:**
```json
{
  "title": "JavaScript入門動画",
  "description": "変数と関数について学習します",
  "materialType": "file",
  "materialCategory": "main",
  "filePath": "/uploads/video1.mp4",
  "fileSize": 52428800,
  "fileType": "video/mp4",
  "durationMinutes": 25,
  "allowManualProgress": false
}
```

**リクエストボディ例（URL型教材）:**
```json
{
  "title": "MDN JavaScript リファレンス",
  "description": "公式ドキュメントで詳細を確認",
  "materialType": "url",
  "materialCategory": "supplementary",
  "externalUrl": "https://developer.mozilla.org/ja/docs/Web/JavaScript",
  "allowManualProgress": true
}
```

### 6.4 補足リソース管理

#### リソース一覧取得
```http
GET /resources?lessonId=1&courseId=1&resourceType=youtube
```

#### リソース作成（管理者のみ）
```http
POST /resources
```

**リクエストボディ例:**
```json
{
  "lessonId": 1,
  "title": "JavaScript チュートリアル",
  "description": "初心者向けの解説動画",
  "resourceType": "youtube",
  "resourceUrl": "https://www.youtube.com/watch?v=abc123",
  "difficultyLevel": "beginner",
  "importance": "recommended",
  "tags": ["javascript", "tutorial", "basic"]
}
```

---

## 7. 進捗管理API

### 7.1 学習進捗管理

#### 自分の進捗一覧取得
```http
GET /progress/me?courseId=1
```

#### 進捗詳細取得
```http
GET /progress/{id}
```

#### 進捗更新（手動進捗入力）
```http
PUT /progress/{id}
```

**リクエストボディ:**
```json
{
  "manualProgressRate": 75.5,
  "spentMinutes": 45,
  "notes": "配列の処理について理解できました",
  "isCompleted": false
}
```

#### 教材完了マーク
```http
POST /progress/complete
```

**リクエストボディ:**
```json
{
  "materialId": 123,
  "spentMinutes": 30
}
```

### 7.2 学習履歴

#### アクセス履歴記録
```http
POST /progress/access
```

**リクエストボディ:**
```json
{
  "materialId": 123,
  "resourceId": 456,
  "accessType": "view",
  "sessionDuration": 15
}
```

#### 学習統計取得
```http
GET /progress/stats?period=week&courseId=1
```

### 7.3 学習継続記録

#### 学習カレンダー取得
```http
GET /progress/streaks?year=2025&month=1
```

#### 今日の学習活動記録
```http
POST /progress/streaks/today
```

---

## 8. テスト・問題管理API

### 8.1 問題管理

#### 問題一覧取得（管理者のみ）
```http
GET /questions?courseId=1&questionType=multiple_choice&difficulty=beginner
```

#### 問題詳細取得（管理者のみ）
```http
GET /questions/{id}
```

#### 問題作成（管理者のみ）
```http
POST /questions
```

**リクエストボディ例（選択問題）:**
```json
{
  "courseId": 1,
  "lessonId": 5,
  "title": "JavaScript変数宣言",
  "questionText": "JavaScriptで変数を宣言する正しい方法は？",
  "questionType": "multiple_choice",
  "difficultyLevel": "beginner",
  "points": 10,
  "explanation": "letキーワードを使用してブロックスコープの変数を宣言します",
  "options": [
    {
      "optionText": "let x = 10;",
      "isCorrect": true,
      "explanation": "正解です。letは推奨される変数宣言方法です。"
    },
    {
      "optionText": "var x = 10;",
      "isCorrect": false,
      "explanation": "varは使用可能ですが、letの方が推奨されます。"
    }
  ]
}
```

### 8.2 テスト管理

#### テスト一覧取得
```http
GET /tests?courseId=1&isPublished=true
```

#### テスト詳細取得
```http
GET /tests/{id}
```

#### テスト作成（管理者のみ）
```http
POST /tests
```

**リクエストボディ:**
```json
{
  "courseId": 1,
  "lessonId": 5,
  "title": "JavaScript基礎テスト",
  "description": "変数と関数に関する理解度テスト",
  "timeLimitMinutes": 30,
  "maxAttempts": 3,
  "passingScore": 70.0,
  "shuffleQuestions": true,
  "questionIds": [1, 2, 3, 4, 5]
}
```

### 8.3 テスト受験

#### テスト開始
```http
POST /tests/{id}/start
```

#### 回答提出
```http
POST /tests/{testId}/answers
```

**リクエストボディ:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 3
    },
    {
      "questionId": 2,
      "answerText": "function add(a, b) { return a + b; }"
    }
  ]
}
```

#### テスト完了
```http
POST /tests/{testId}/complete
```

#### テスト結果取得
```http
GET /tests/{testId}/results/{resultId}
```

### 8.4 採点管理（管理者のみ）

#### 採点待ち一覧取得
```http
GET /grading/pending?courseId=1&questionType=essay
```

#### 採点実行
```http
POST /grading/{answerId}
```

**リクエストボディ:**
```json
{
  "pointsEarned": 8,
  "feedback": "良い回答です。エラーハンドリングも考慮するとより良くなります。"
}
```

---

## 9. Q&A・ナレッジ管理API

### 9.1 質問管理

#### 質問一覧取得
```http
GET /qa/questions?courseId=1&category=programming&isPublic=true&isResolved=false
```

#### 質問詳細取得
```http
GET /qa/questions/{id}
```

#### 質問投稿
```http
POST /qa/questions
```

**リクエストボディ:**
```json
{
  "courseId": 1,
  "lessonId": 5,
  "questionTitle": "配列のmap関数について",
  "questionContent": "配列のmap関数の使い方がよく分かりません...",
  "questionTags": ["javascript", "array", "map"],
  "category": "programming",
  "priority": "normal",
  "isPublic": true,
  "attachments": [
    {
      "fileName": "code_sample.js",
      "filePath": "/uploads/qa/code_sample.js"
    }
  ]
}
```

#### 質問更新
```http
PUT /qa/questions/{id}
```

#### 質問削除
```http
DELETE /qa/questions/{id}
```

### 9.2 回答管理

#### 回答一覧取得
```http
GET /qa/questions/{questionId}/answers
```

#### 回答投稿
```http
POST /qa/questions/{questionId}/answers
```

**リクエストボディ:**
```json
{
  "answerContent": "map関数は新しい配列を作成します...",
  "attachments": [
    {
      "fileName": "example.js",
      "filePath": "/uploads/qa/example.js"
    }
  ]
}
```

#### ベストアンサー設定
```http
PUT /qa/answers/{id}/best-answer
```

### 9.3 Q&A評価

#### 質問・回答への評価
```http
POST /qa/votes
```

**リクエストボディ:**
```json
{
  "questionId": 123,
  "voteType": "like"
}
```

#### 評価取得
```http
GET /qa/questions/{id}/votes
```

### 9.4 ナレッジベース

#### ナレッジ一覧取得
```http
GET /knowledge?category=programming&search=javascript
```

#### FAQ取得
```http
GET /knowledge/faq?category=programming
```

#### ナレッジ作成（管理者のみ）
```http
POST /knowledge
```

**リクエストボディ:**
```json
{
  "questionId": 123,
  "title": "JavaScript配列操作のベストプラクティス",
  "content": "配列操作でよく使用される方法について...",
  "faqCategory": "programming",
  "searchKeywords": ["javascript", "array", "map", "filter"],
  "relatedMaterials": [1, 2, 3]
}
```

---

## 10. ゲーミフィケーションAPI

### 10.1 スキル管理

#### スキル一覧取得
```http
GET /skills?category=programming
```

#### ユーザースキル取得
```http
GET /users/{userId}/skills
```

#### スキルレベル更新
```http
PUT /users/me/skills/{skillId}
```

**リクエストボディ:**
```json
{
  "skillLevel": 5,
  "experiencePoints": 1250
}
```

### 10.2 バッジ・称号

#### バッジ一覧取得
```http
GET /badges?category=learning&rarity=rare
```

#### ユーザーバッジ取得
```http
GET /users/{userId}/badges
```

#### バッジ表示設定更新
```http
PUT /users/me/badges/{badgeId}/display
```

### 10.3 ポイント管理

#### ポイント履歴取得
```http
GET /users/{userId}/points?period=month
```

#### ポイント付与（システム内部）
```http
POST /points/award
```

**リクエストボディ:**
```json
{
  "userId": 123,
  "pointsChange": 50,
  "pointSource": "lesson_completion",
  "sourceId": 456,
  "description": "JavaScript基礎レッスン完了"
}
```

### 10.4 ランキング

#### 学習時間ランキング
```http
GET /rankings/study-time?period=month&limit=50
```

#### ポイントランキング
```http
GET /rankings/points?period=week&category=programming
```

#### Q&A貢献度ランキング
```http
GET /rankings/qa-contribution?period=month
```

---

## 11. コミュニケーションAPI

### 11.1 フォーラム管理

#### フォーラム一覧取得
```http
GET /forums?category=programming&isPublic=true
```

#### フォーラム詳細取得
```http
GET /forums/{id}
```

#### フォーラム作成（管理者のみ）
```http
POST /forums
```

### 11.2 トピック管理

#### トピック一覧取得
```http
GET /forums/{forumId}/topics?isPinned=false&sortBy=lastReplyAt
```

#### トピック詳細取得
```http
GET /topics/{id}
```

#### トピック作成
```http
POST /forums/{forumId}/topics
```

**リクエストボディ:**
```json
{
  "title": "React Hooksの使い方について",
  "content": "useEffectの依存配列について質問があります..."
}
```

### 11.3 投稿管理

#### 投稿一覧取得
```http
GET /topics/{topicId}/posts
```

#### 投稿作成
```http
POST /topics/{topicId}/posts
```

#### 投稿へのいいね
```http
POST /posts/{id}/like
```

### 11.4 通知管理

#### 通知一覧取得
```http
GET /notifications?isRead=false&limit=20
```

#### 通知既読マーク
```http
PUT /notifications/{id}/read
```

#### 一括既読
```http
PUT /notifications/read-all
```

---

## 12. システム管理API

### 12.1 システム設定（管理者のみ）

#### 設定一覧取得
```http
GET /admin/settings
```

#### 設定更新
```http
PUT /admin/settings/{key}
```

### 12.2 監査ログ（管理者のみ）

#### ログ一覧取得
```http
GET /admin/audit-logs?action=user_login&startDate=2025-01-01
```

### 12.3 ファイル管理

#### ファイルアップロード
```http
POST /files/upload
```

**リクエスト:**
```http
Content-Type: multipart/form-data

file: [ファイル]
entityType: "learning_material"
entityId: 123
```

#### ファイル削除
```http
DELETE /files/{id}
```

### 12.4 システム統計（管理者のみ）

#### ダッシュボード統計取得
```http
GET /admin/dashboard/stats
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 450,
      "active": 380,
      "newThisMonth": 25
    },
    "courses": {
      "total": 15,
      "published": 12
    },
    "learningActivity": {
      "totalHours": 12450,
      "avgHoursPerUser": 27.7
    }
  }
}
```

---

## WebSocket API仕様

### リアルタイム機能
- **接続エンドポイント**: `wss://api.lms.example.com/ws`
- **認証**: クエリパラメータでJWTトークンを送信

### イベント一覧

#### 通知受信
```json
{
  "type": "notification",
  "data": {
    "id": 123,
    "title": "新しい回答が投稿されました",
    "message": "あなたの質問に回答がありました"
  }
}
```

#### 学習進捗更新
```json
{
  "type": "progress_update",
  "data": {
    "userId": 456,
    "courseId": 1,
    "progressRate": 75.5
  }
}
```

---

## レート制限

### 制限事項
- **一般API**: 1000リクエスト/時間
- **認証API**: 10リクエスト/分
- **ファイルアップロード**: 50MB/日

### レスポンスヘッダー
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643723400
```

---

## セキュリティ

### CORS設定
- **許可オリジン**: フロントエンドドメインのみ
- **許可メソッド**: GET, POST, PUT, DELETE, OPTIONS
- **許可ヘッダー**: Authorization, Content-Type

### セキュリティヘッダー
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

**作成日**: 2025年1月31日  
**バージョン**: 1.0  
**対象システム**: 学習管理システム（LMS）  
**技術スタック**: Node.js + Express + Prisma + PostgreSQL