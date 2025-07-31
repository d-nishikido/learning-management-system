# 学習管理システム（LMS）テーブル定義書

## 目次
1. [ユーザー管理](#1-ユーザー管理)
2. [学習コンテンツ管理](#2-学習コンテンツ管理)
3. [進捗管理](#3-進捗管理)
4. [テスト・問題管理](#4-テスト問題管理)
5. [Q&A・ナレッジ管理](#5-qaナレッジ管理)
6. [ゲーミフィケーション](#6-ゲーミフィケーション)
7. [コミュニケーション](#7-コミュニケーション)
8. [システム管理](#8-システム管理)

---

## 1. ユーザー管理

### 1.1 users（ユーザー）
ユーザーの基本情報を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ユーザーID（自動採番） |
| username | VARCHAR(50) | NOT NULL |  | UNIQUE | ユーザー名 |
| email | VARCHAR(255) | NOT NULL |  | UNIQUE | メールアドレス |
| password_hash | VARCHAR(255) | NOT NULL |  |  | パスワードハッシュ（bcrypt） |
| first_name | VARCHAR(50) | NOT NULL |  |  | 姓 |
| last_name | VARCHAR(50) | NOT NULL |  |  | 名 |
| role | VARCHAR(20) | NOT NULL | 'user' | CHECK (role IN ('user', 'admin')) | ユーザーロール |
| profile_image_url | VARCHAR(500) | NULL |  |  | プロフィール画像URL |
| bio | TEXT | NULL |  |  | 自己紹介 |
| is_active | BOOLEAN | NOT NULL | true |  | アクティブフラグ |
| last_login | TIMESTAMP | NULL |  |  | 最終ログイン日時 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_users_email` ON email
- `idx_users_username` ON username
- `idx_users_role` ON role

---

## 2. 学習コンテンツ管理

### 2.1 courses（コース）
学習コースの情報を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | コースID（自動採番） |
| title | VARCHAR(200) | NOT NULL |  |  | コースタイトル |
| description | TEXT | NULL |  |  | コース説明 |
| category | VARCHAR(50) | NOT NULL |  |  | カテゴリ（プログラミング、資格試験等） |
| difficulty_level | VARCHAR(20) | NOT NULL | 'beginner' | CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) | 難易度 |
| estimated_hours | INTEGER | NULL |  | CHECK (estimated_hours > 0) | 推定学習時間（時間） |
| thumbnail_url | VARCHAR(500) | NULL |  |  | サムネイル画像URL |
| is_published | BOOLEAN | NOT NULL | false |  | 公開フラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| created_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | 作成者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_courses_category` ON category
- `idx_courses_difficulty_level` ON difficulty_level
- `idx_courses_is_published` ON is_published
- `idx_courses_sort_order` ON sort_order

### 2.2 lessons（レッスン）
コース内のレッスン情報を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | レッスンID（自動採番） |
| course_id | INTEGER | NOT NULL |  | FOREIGN KEY (courses.id) ON DELETE CASCADE | コースID |
| title | VARCHAR(200) | NOT NULL |  |  | レッスンタイトル |
| description | TEXT | NULL |  |  | レッスン説明 |
| content | TEXT | NULL |  |  | レッスン本文（マークダウン対応） |
| estimated_minutes | INTEGER | NULL |  | CHECK (estimated_minutes > 0) | 推定学習時間（分） |
| sort_order | INTEGER | NOT NULL | 0 |  | レッスン順序 |
| is_published | BOOLEAN | NOT NULL | false |  | 公開フラグ |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_lessons_course_id` ON course_id
- `idx_lessons_sort_order` ON sort_order
- `idx_lessons_is_published` ON is_published

### 2.3 learning_materials（学習教材）
レッスンに紐づく学習教材を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 教材ID（自動採番） |
| lesson_id | INTEGER | NOT NULL |  | FOREIGN KEY (lessons.id) ON DELETE CASCADE | レッスンID |
| title | VARCHAR(200) | NOT NULL |  |  | 教材タイトル |
| description | TEXT | NULL |  |  | 教材説明 |
| material_type | VARCHAR(20) | NOT NULL |  | CHECK (material_type IN ('file', 'url', 'manual_progress')) | 教材タイプ |
| material_category | VARCHAR(20) | NOT NULL | 'main' | CHECK (material_category IN ('main', 'supplementary')) | 教材カテゴリ |
| file_path | VARCHAR(500) | NULL |  |  | ファイルパス（file タイプ用） |
| file_size | BIGINT | NULL |  |  | ファイルサイズ（バイト） |
| file_type | VARCHAR(100) | NULL |  |  | ファイルMIMEタイプ |
| external_url | VARCHAR(1000) | NULL |  |  | 外部URL（url タイプ用） |
| duration_minutes | INTEGER | NULL |  |  | 動画・音声の長さ（分） |
| allow_manual_progress | BOOLEAN | NOT NULL | false |  | 手動進捗入力許可 |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| is_published | BOOLEAN | NOT NULL | true |  | 公開フラグ |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_learning_materials_lesson_id` ON lesson_id
- `idx_learning_materials_material_type` ON material_type
- `idx_learning_materials_sort_order` ON sort_order

### 2.4 learning_resources（補足リソース）
学習の補足リソースを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | リソースID（自動採番） |
| lesson_id | INTEGER | NULL |  | FOREIGN KEY (lessons.id) ON DELETE CASCADE | レッスンID（NULL可：全般的なリソース） |
| course_id | INTEGER | NULL |  | FOREIGN KEY (courses.id) ON DELETE CASCADE | コースID（NULL可：全般的なリソース） |
| title | VARCHAR(200) | NOT NULL |  |  | リソースタイトル |
| description | TEXT | NULL |  |  | リソース説明 |
| resource_type | VARCHAR(20) | NOT NULL |  | CHECK (resource_type IN ('file', 'website', 'youtube', 'document', 'tool')) | リソースタイプ |
| resource_url | VARCHAR(1000) | NOT NULL |  |  | リソースURL |
| difficulty_level | VARCHAR(20) | NOT NULL | 'beginner' | CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) | 難易度 |
| importance | VARCHAR(20) | NOT NULL | 'reference' | CHECK (importance IN ('required', 'recommended', 'reference')) | 重要度 |
| tags | TEXT | NULL |  |  | タグ（JSON配列形式） |
| thumbnail_url | VARCHAR(500) | NULL |  |  | サムネイル画像URL |
| view_count | INTEGER | NOT NULL | 0 |  | 閲覧数 |
| is_published | BOOLEAN | NOT NULL | true |  | 公開フラグ |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_learning_resources_lesson_id` ON lesson_id
- `idx_learning_resources_course_id` ON course_id
- `idx_learning_resources_resource_type` ON resource_type
- `idx_learning_resources_difficulty_level` ON difficulty_level

---

## 3. 進捗管理

### 3.1 user_progress（ユーザー進捗）
ユーザーの学習進捗を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 進捗ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| course_id | INTEGER | NOT NULL |  | FOREIGN KEY (courses.id) ON DELETE CASCADE | コースID |
| lesson_id | INTEGER | NULL |  | FOREIGN KEY (lessons.id) ON DELETE CASCADE | レッスンID |
| material_id | INTEGER | NULL |  | FOREIGN KEY (learning_materials.id) ON DELETE CASCADE | 教材ID |
| progress_type | VARCHAR(20) | NOT NULL | 'auto' | CHECK (progress_type IN ('auto', 'manual')) | 進捗タイプ |
| progress_rate | DECIMAL(5,2) | NOT NULL | 0.00 | CHECK (progress_rate >= 0 AND progress_rate <= 100) | 進捗率（%） |
| manual_progress_rate | DECIMAL(5,2) | NULL |  | CHECK (manual_progress_rate >= 0 AND manual_progress_rate <= 100) | 手動入力進捗率（%） |
| spent_minutes | INTEGER | NOT NULL | 0 |  | 学習時間（分） |
| is_completed | BOOLEAN | NOT NULL | false |  | 完了フラグ |
| completion_date | TIMESTAMP | NULL |  |  | 完了日時 |
| notes | TEXT | NULL |  |  | 学習メモ |
| last_accessed | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 最終アクセス日時 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_user_progress_user_id` ON user_id
- `idx_user_progress_course_id` ON course_id
- `idx_user_progress_lesson_id` ON lesson_id
- `idx_user_progress_is_completed` ON is_completed
- `idx_user_progress_last_accessed` ON last_accessed

**UNIQUE制約:**
- `unique_user_progress` (user_id, course_id, lesson_id, material_id)

### 3.2 user_material_access（教材アクセス履歴）
ユーザーの教材アクセス履歴を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | アクセス履歴ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| material_id | INTEGER | NOT NULL |  | FOREIGN KEY (learning_materials.id) ON DELETE CASCADE | 教材ID |
| resource_id | INTEGER | NULL |  | FOREIGN KEY (learning_resources.id) ON DELETE CASCADE | リソースID |
| access_type | VARCHAR(20) | NOT NULL |  | CHECK (access_type IN ('view', 'download', 'external_link')) | アクセスタイプ |
| session_duration | INTEGER | NULL |  |  | セッション時間（分） |
| ip_address | INET | NULL |  |  | アクセス元IPアドレス |
| user_agent | TEXT | NULL |  |  | ユーザーエージェント |
| accessed_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | アクセス日時 |

**インデックス:**
- `idx_user_material_access_user_id` ON user_id
- `idx_user_material_access_material_id` ON material_id
- `idx_user_material_access_accessed_at` ON accessed_at

### 3.3 learning_streaks（学習継続記録）
ユーザーの学習継続状況を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 継続記録ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| streak_date | DATE | NOT NULL |  |  | 学習日 |
| minutes_studied | INTEGER | NOT NULL | 0 |  | その日の学習時間（分） |
| lessons_completed | INTEGER | NOT NULL | 0 |  | その日完了したレッスン数 |
| materials_accessed | INTEGER | NOT NULL | 0 |  | その日アクセスした教材数 |
| points_earned | INTEGER | NOT NULL | 0 |  | その日獲得したポイント |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_learning_streaks_user_id` ON user_id
- `idx_learning_streaks_streak_date` ON streak_date

**UNIQUE制約:**
- `unique_user_streak_date` (user_id, streak_date)

---

## 4. テスト・問題管理

### 4.1 questions（問題）
テスト問題を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 問題ID（自動採番） |
| course_id | INTEGER | NULL |  | FOREIGN KEY (courses.id) ON DELETE SET NULL | 関連コースID |
| lesson_id | INTEGER | NULL |  | FOREIGN KEY (lessons.id) ON DELETE SET NULL | 関連レッスンID |
| title | VARCHAR(200) | NOT NULL |  |  | 問題タイトル |
| question_text | TEXT | NOT NULL |  |  | 問題文 |
| question_type | VARCHAR(20) | NOT NULL |  | CHECK (question_type IN ('multiple_choice', 'essay', 'programming', 'true_false')) | 問題タイプ |
| difficulty_level | VARCHAR(20) | NOT NULL | 'beginner' | CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) | 難易度 |
| points | INTEGER | NOT NULL | 10 | CHECK (points > 0) | 配点 |
| time_limit_minutes | INTEGER | NULL |  | CHECK (time_limit_minutes > 0) | 制限時間（分） |
| explanation | TEXT | NULL |  |  | 解説 |
| hints | TEXT | NULL |  |  | ヒント（JSON配列形式） |
| tags | TEXT | NULL |  |  | タグ（JSON配列形式） |
| is_published | BOOLEAN | NOT NULL | false |  | 公開フラグ |
| created_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | 作成者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_questions_course_id` ON course_id
- `idx_questions_lesson_id` ON lesson_id
- `idx_questions_question_type` ON question_type
- `idx_questions_difficulty_level` ON difficulty_level
- `idx_questions_created_by` ON created_by

### 4.2 question_options（問題選択肢）
選択問題の選択肢を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 選択肢ID（自動採番） |
| question_id | INTEGER | NOT NULL |  | FOREIGN KEY (questions.id) ON DELETE CASCADE | 問題ID |
| option_text | TEXT | NOT NULL |  |  | 選択肢テキスト |
| is_correct | BOOLEAN | NOT NULL | false |  | 正解フラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| explanation | TEXT | NULL |  |  | 選択肢の解説 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_question_options_question_id` ON question_id
- `idx_question_options_sort_order` ON sort_order

### 4.3 tests（テスト）
テスト定義を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | テストID（自動採番） |
| course_id | INTEGER | NOT NULL |  | FOREIGN KEY (courses.id) ON DELETE CASCADE | コースID |
| lesson_id | INTEGER | NULL |  | FOREIGN KEY (lessons.id) ON DELETE CASCADE | レッスンID（NULL可：コースレベルテスト） |
| title | VARCHAR(200) | NOT NULL |  |  | テストタイトル |
| description | TEXT | NULL |  |  | テスト説明 |
| time_limit_minutes | INTEGER | NULL |  | CHECK (time_limit_minutes > 0) | 制限時間（分） |
| max_attempts | INTEGER | NULL |  | CHECK (max_attempts > 0) | 最大受験回数 |
| passing_score | DECIMAL(5,2) | NOT NULL | 60.00 | CHECK (passing_score >= 0 AND passing_score <= 100) | 合格点（%） |
| shuffle_questions | BOOLEAN | NOT NULL | false |  | 問題順序ランダム化 |
| shuffle_options | BOOLEAN | NOT NULL | false |  | 選択肢順序ランダム化 |
| show_results_immediately | BOOLEAN | NOT NULL | true |  | 結果即時表示 |
| is_published | BOOLEAN | NOT NULL | false |  | 公開フラグ |
| available_from | TIMESTAMP | NULL |  |  | 受験開始日時 |
| available_until | TIMESTAMP | NULL |  |  | 受験終了日時 |
| created_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | 作成者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_tests_course_id` ON course_id
- `idx_tests_lesson_id` ON lesson_id
- `idx_tests_is_published` ON is_published
- `idx_tests_available_from` ON available_from

### 4.4 test_questions（テスト問題関連）
テストと問題の関連を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 関連ID（自動採番） |
| test_id | INTEGER | NOT NULL |  | FOREIGN KEY (tests.id) ON DELETE CASCADE | テストID |
| question_id | INTEGER | NOT NULL |  | FOREIGN KEY (questions.id) ON DELETE CASCADE | 問題ID |
| sort_order | INTEGER | NOT NULL | 0 |  | 問題順序 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_test_questions_test_id` ON test_id
- `idx_test_questions_question_id` ON question_id
- `idx_test_questions_sort_order` ON sort_order

**UNIQUE制約:**
- `unique_test_question` (test_id, question_id)

### 4.5 user_test_results（ユーザーテスト結果）
ユーザーのテスト受験結果を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 結果ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| test_id | INTEGER | NOT NULL |  | FOREIGN KEY (tests.id) ON DELETE CASCADE | テストID |
| attempt_number | INTEGER | NOT NULL | 1 | CHECK (attempt_number > 0) | 受験回数 |
| score | DECIMAL(5,2) | NOT NULL | 0.00 | CHECK (score >= 0 AND score <= 100) | 得点（%） |
| total_points | INTEGER | NOT NULL | 0 |  | 総配点 |
| earned_points | INTEGER | NOT NULL | 0 |  | 獲得点数 |
| is_passed | BOOLEAN | NOT NULL | false |  | 合格フラグ |
| time_spent_minutes | INTEGER | NULL |  |  | 受験時間（分） |
| started_at | TIMESTAMP | NOT NULL |  |  | 開始日時 |
| completed_at | TIMESTAMP | NULL |  |  | 完了日時 |
| status | VARCHAR(20) | NOT NULL | 'in_progress' | CHECK (status IN ('in_progress', 'completed', 'abandoned')) | 受験状態 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_user_test_results_user_id` ON user_id
- `idx_user_test_results_test_id` ON test_id
- `idx_user_test_results_is_passed` ON is_passed
- `idx_user_test_results_completed_at` ON completed_at

### 4.6 user_answers（ユーザー回答）
ユーザーの問題回答を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 回答ID（自動採番） |
| test_result_id | INTEGER | NOT NULL |  | FOREIGN KEY (user_test_results.id) ON DELETE CASCADE | テスト結果ID |
| question_id | INTEGER | NOT NULL |  | FOREIGN KEY (questions.id) ON DELETE CASCADE | 問題ID |
| selected_option_id | INTEGER | NULL |  | FOREIGN KEY (question_options.id) | 選択した選択肢ID |
| answer_text | TEXT | NULL |  |  | 記述回答・プログラムコード |
| is_correct | BOOLEAN | NULL |  |  | 正解フラグ（自動採点用） |
| points_earned | INTEGER | NOT NULL | 0 |  | 獲得点数 |
| graded_by | INTEGER | NULL |  | FOREIGN KEY (users.id) | 採点者ID |
| feedback | TEXT | NULL |  |  | 採点者からのフィードバック |
| graded_at | TIMESTAMP | NULL |  |  | 採点日時 |
| answered_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 回答日時 |

**インデックス:**
- `idx_user_answers_test_result_id` ON test_result_id
- `idx_user_answers_question_id` ON question_id
- `idx_user_answers_graded_by` ON graded_by

---

## 5. Q&A・ナレッジ管理

### 5.1 qa_questions（Q&A質問）
Q&Aの質問を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 質問ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 質問者ID |
| course_id | INTEGER | NULL |  | FOREIGN KEY (courses.id) ON DELETE SET NULL | 関連コースID |
| lesson_id | INTEGER | NULL |  | FOREIGN KEY (lessons.id) ON DELETE SET NULL | 関連レッスンID |
| question_title | VARCHAR(200) | NOT NULL |  |  | 質問タイトル |
| question_content | TEXT | NOT NULL |  |  | 質問内容（マークダウン対応） |
| question_tags | TEXT | NULL |  |  | タグ（JSON配列形式） |
| category | VARCHAR(50) | NULL |  |  | 質問カテゴリ |
| priority | VARCHAR(20) | NOT NULL | 'normal' | CHECK (priority IN ('normal', 'urgent')) | 緊急度 |
| is_public | BOOLEAN | NOT NULL | true |  | 公開・非公開設定 |
| is_resolved | BOOLEAN | NOT NULL | false |  | 解決済みフラグ |
| view_count | INTEGER | NOT NULL | 0 |  | 閲覧数 |
| vote_count | INTEGER | NOT NULL | 0 |  | 投票数（いいね） |
| answer_count | INTEGER | NOT NULL | 0 |  | 回答数 |
| best_answer_id | INTEGER | NULL |  |  | ベストアンサーID |
| resolved_at | TIMESTAMP | NULL |  |  | 解決日時 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 質問日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_qa_questions_user_id` ON user_id
- `idx_qa_questions_course_id` ON course_id
- `idx_qa_questions_lesson_id` ON lesson_id
- `idx_qa_questions_category` ON category
- `idx_qa_questions_is_public` ON is_public
- `idx_qa_questions_is_resolved` ON is_resolved
- `idx_qa_questions_created_at` ON created_at

### 5.2 qa_answers（Q&A回答）
Q&Aの回答を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 回答ID（自動採番） |
| question_id | INTEGER | NOT NULL |  | FOREIGN KEY (qa_questions.id) ON DELETE CASCADE | 質問ID |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 回答者ID |
| answer_content | TEXT | NOT NULL |  |  | 回答内容（マークダウン対応） |
| is_best_answer | BOOLEAN | NOT NULL | false |  | ベストアンサーフラグ |
| helpful_count | INTEGER | NOT NULL | 0 |  | 参考になった評価数 |
| vote_count | INTEGER | NOT NULL | 0 |  | 投票数（いいね） |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 回答日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_qa_answers_question_id` ON question_id
- `idx_qa_answers_user_id` ON user_id
- `idx_qa_answers_is_best_answer` ON is_best_answer
- `idx_qa_answers_created_at` ON created_at

### 5.3 qa_attachments（Q&A添付ファイル）
Q&Aの添付ファイルを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 添付ファイルID（自動採番） |
| question_id | INTEGER | NULL |  | FOREIGN KEY (qa_questions.id) ON DELETE CASCADE | 質問ID |
| answer_id | INTEGER | NULL |  | FOREIGN KEY (qa_answers.id) ON DELETE CASCADE | 回答ID |
| file_name | VARCHAR(255) | NOT NULL |  |  | ファイル名 |
| file_path | VARCHAR(500) | NOT NULL |  |  | ファイルパス |
| file_size | BIGINT | NOT NULL |  |  | ファイルサイズ（バイト） |
| file_type | VARCHAR(100) | NOT NULL |  |  | ファイルMIMEタイプ |
| uploaded_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | アップロード者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | アップロード日時 |

**インデックス:**
- `idx_qa_attachments_question_id` ON question_id
- `idx_qa_attachments_answer_id` ON answer_id
- `idx_qa_attachments_uploaded_by` ON uploaded_by

**CHECK制約:**
- `chk_qa_attachments_reference` CHECK ((question_id IS NOT NULL AND answer_id IS NULL) OR (question_id IS NULL AND answer_id IS NOT NULL))

### 5.4 qa_votes（Q&A評価）
Q&Aの評価（いいね・参考になった）を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 評価ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 評価者ID |
| question_id | INTEGER | NULL |  | FOREIGN KEY (qa_questions.id) ON DELETE CASCADE | 質問ID |
| answer_id | INTEGER | NULL |  | FOREIGN KEY (qa_answers.id) ON DELETE CASCADE | 回答ID |
| vote_type | VARCHAR(20) | NOT NULL |  | CHECK (vote_type IN ('like', 'helpful', 'dislike')) | 評価タイプ |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 評価日時 |

**インデックス:**
- `idx_qa_votes_user_id` ON user_id
- `idx_qa_votes_question_id` ON question_id
- `idx_qa_votes_answer_id` ON answer_id
- `idx_qa_votes_vote_type` ON vote_type

**UNIQUE制約:**
- `unique_user_question_vote` (user_id, question_id, vote_type)
- `unique_user_answer_vote` (user_id, answer_id, vote_type)

**CHECK制約:**
- `chk_qa_votes_reference` CHECK ((question_id IS NOT NULL AND answer_id IS NULL) OR (question_id IS NULL AND answer_id IS NOT NULL))

### 5.5 knowledge_base（ナレッジベース）
ナレッジベース・FAQ管理テーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ナレッジID（自動採番） |
| question_id | INTEGER | NULL |  | FOREIGN KEY (qa_questions.id) ON DELETE SET NULL | 元質問ID |
| title | VARCHAR(200) | NOT NULL |  |  | ナレッジタイトル |
| content | TEXT | NOT NULL |  |  | ナレッジ内容 |
| faq_category | VARCHAR(50) | NULL |  |  | FAQカテゴリ |
| search_keywords | TEXT | NULL |  |  | 検索用キーワード |
| related_materials | TEXT | NULL |  |  | 関連教材ID（JSON配列形式） |
| tags | TEXT | NULL |  |  | タグ（JSON配列形式） |
| view_count | INTEGER | NOT NULL | 0 |  | 閲覧数 |
| is_published | BOOLEAN | NOT NULL | true |  | 公開フラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| created_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | 作成者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_knowledge_base_question_id` ON question_id
- `idx_knowledge_base_faq_category` ON faq_category
- `idx_knowledge_base_is_published` ON is_published
- `idx_knowledge_base_sort_order` ON sort_order
- `idx_knowledge_base_view_count` ON view_count

---

## 6. ゲーミフィケーション

### 6.1 skills（スキル定義）
スキル・技術分野の定義を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | スキルID（自動採番） |
| skill_name | VARCHAR(100) | NOT NULL |  |  | スキル名 |
| skill_category | VARCHAR(50) | NOT NULL |  |  | スキルカテゴリ（プログラミング言語、フレームワーク等） |
| description | TEXT | NULL |  |  | スキル説明 |
| icon_url | VARCHAR(500) | NULL |  |  | アイコンURL |
| color_code | VARCHAR(7) | NULL |  |  | カラーコード（#RRGGBB） |
| is_active | BOOLEAN | NOT NULL | true |  | アクティブフラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_skills_skill_category` ON skill_category
- `idx_skills_is_active` ON is_active
- `idx_skills_sort_order` ON sort_order

**UNIQUE制約:**
- `unique_skill_name_category` (skill_name, skill_category)

### 6.2 user_skills（ユーザースキル）
ユーザーのスキルレベルを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ユーザースキルID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| skill_id | INTEGER | NOT NULL |  | FOREIGN KEY (skills.id) ON DELETE CASCADE | スキルID |
| skill_level | INTEGER | NOT NULL | 1 | CHECK (skill_level >= 1 AND skill_level <= 10) | スキルレベル（1-10） |
| experience_points | INTEGER | NOT NULL | 0 |  | 経験値 |
| last_activity_date | DATE | NULL |  |  | 最終活動日 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_user_skills_user_id` ON user_id
- `idx_user_skills_skill_id` ON skill_id
- `idx_user_skills_skill_level` ON skill_level

**UNIQUE制約:**
- `unique_user_skill` (user_id, skill_id)

### 6.3 badges（バッジ定義）
バッジ・称号の定義を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | バッジID（自動採番） |
| badge_name | VARCHAR(100) | NOT NULL |  |  | バッジ名 |
| badge_category | VARCHAR(50) | NOT NULL |  |  | バッジカテゴリ（学習、Q&A、達成等） |
| description | TEXT | NOT NULL |  |  | バッジ説明 |
| icon_url | VARCHAR(500) | NULL |  |  | バッジアイコンURL |
| badge_color | VARCHAR(20) | NOT NULL | 'bronze' | CHECK (badge_color IN ('bronze', 'silver', 'gold', 'platinum')) | バッジランク |
| points_reward | INTEGER | NOT NULL | 0 |  | 獲得時ボーナスポイント |
| rarity | VARCHAR(20) | NOT NULL | 'common' | CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) | レア度 |
| achievement_condition | TEXT | NULL |  |  | 獲得条件（JSON形式） |
| is_active | BOOLEAN | NOT NULL | true |  | アクティブフラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_badges_badge_category` ON badge_category
- `idx_badges_badge_color` ON badge_color
- `idx_badges_rarity` ON rarity
- `idx_badges_is_active` ON is_active

### 6.4 user_badges（ユーザーバッジ）
ユーザーが獲得したバッジを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ユーザーバッジID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| badge_id | INTEGER | NOT NULL |  | FOREIGN KEY (badges.id) ON DELETE CASCADE | バッジID |
| earned_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 獲得日時 |
| is_displayed | BOOLEAN | NOT NULL | true |  | プロフィール表示フラグ |
| achievement_data | TEXT | NULL |  |  | 獲得時の詳細データ（JSON形式） |

**インデックス:**
- `idx_user_badges_user_id` ON user_id
- `idx_user_badges_badge_id` ON badge_id
- `idx_user_badges_earned_at` ON earned_at

**UNIQUE制約:**
- `unique_user_badge` (user_id, badge_id)

### 6.5 user_points（ユーザーポイント履歴）
ユーザーのポイント獲得履歴を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ポイント履歴ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | ユーザーID |
| points_change | INTEGER | NOT NULL |  |  | ポイント変動量（+ or -） |
| points_balance | INTEGER | NOT NULL |  |  | 変動後ポイント残高 |
| point_source | VARCHAR(50) | NOT NULL |  |  | ポイント獲得源 |
| source_id | INTEGER | NULL |  |  | 関連リソースID（レッスンID、テストID等） |
| description | TEXT | NULL |  |  | 詳細説明 |
| multiplier | DECIMAL(3,2) | NOT NULL | 1.00 |  | ボーナス倍率 |
| earned_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 獲得日時 |

**インデックス:**
- `idx_user_points_user_id` ON user_id
- `idx_user_points_point_source` ON point_source
- `idx_user_points_earned_at` ON earned_at

---

## 7. コミュニケーション

### 7.1 forums（フォーラム・掲示板）
フォーラム・掲示板を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | フォーラムID（自動採番） |
| title | VARCHAR(200) | NOT NULL |  |  | フォーラムタイトル |
| description | TEXT | NULL |  |  | フォーラム説明 |
| category | VARCHAR(50) | NOT NULL |  |  | フォーラムカテゴリ |
| is_public | BOOLEAN | NOT NULL | true |  | 公開フラグ |
| is_readonly | BOOLEAN | NOT NULL | false |  | 読み取り専用フラグ |
| sort_order | INTEGER | NOT NULL | 0 |  | 表示順序 |
| topic_count | INTEGER | NOT NULL | 0 |  | トピック数 |
| post_count | INTEGER | NOT NULL | 0 |  | 投稿数 |
| last_post_id | INTEGER | NULL |  |  | 最新投稿ID |
| last_post_at | TIMESTAMP | NULL |  |  | 最新投稿日時 |
| created_by | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) | 作成者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_forums_category` ON category
- `idx_forums_is_public` ON is_public
- `idx_forums_sort_order` ON sort_order

### 7.2 forum_topics（フォーラムトピック）
フォーラムのトピックを管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | トピックID（自動採番） |
| forum_id | INTEGER | NOT NULL |  | FOREIGN KEY (forums.id) ON DELETE CASCADE | フォーラムID |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 作成者ID |
| title | VARCHAR(200) | NOT NULL |  |  | トピックタイトル |
| content | TEXT | NOT NULL |  |  | 初回投稿内容 |
| is_pinned | BOOLEAN | NOT NULL | false |  | ピン留めフラグ |
| is_locked | BOOLEAN | NOT NULL | false |  | ロックフラグ |
| view_count | INTEGER | NOT NULL | 0 |  | 閲覧数 |
| reply_count | INTEGER | NOT NULL | 0 |  | 返信数 |
| last_reply_id | INTEGER | NULL |  |  | 最新返信ID |
| last_reply_at | TIMESTAMP | NULL |  |  | 最新返信日時 |
| last_reply_user_id | INTEGER | NULL |  | FOREIGN KEY (users.id) | 最新返信者ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_forum_topics_forum_id` ON forum_id
- `idx_forum_topics_user_id` ON user_id
- `idx_forum_topics_is_pinned` ON is_pinned
- `idx_forum_topics_last_reply_at` ON last_reply_at

### 7.3 forum_posts（フォーラム投稿）
フォーラムの投稿を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 投稿ID（自動採番） |
| topic_id | INTEGER | NOT NULL |  | FOREIGN KEY (forum_topics.id) ON DELETE CASCADE | トピックID |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 投稿者ID |
| content | TEXT | NOT NULL |  |  | 投稿内容 |
| is_first_post | BOOLEAN | NOT NULL | false |  | 初回投稿フラグ |
| quote_post_id | INTEGER | NULL |  | FOREIGN KEY (forum_posts.id) | 引用投稿ID |
| like_count | INTEGER | NOT NULL | 0 |  | いいね数 |
| is_edited | BOOLEAN | NOT NULL | false |  | 編集済みフラグ |
| edited_by | INTEGER | NULL |  | FOREIGN KEY (users.id) | 編集者ID |
| edited_at | TIMESTAMP | NULL |  |  | 編集日時 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 投稿日時 |

**インデックス:**
- `idx_forum_posts_topic_id` ON topic_id
- `idx_forum_posts_user_id` ON user_id
- `idx_forum_posts_created_at` ON created_at

### 7.4 notifications（通知）
ユーザー通知を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 通知ID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | 通知対象ユーザーID |
| notification_type | VARCHAR(50) | NOT NULL |  |  | 通知タイプ |
| title | VARCHAR(200) | NOT NULL |  |  | 通知タイトル |
| message | TEXT | NULL |  |  | 通知メッセージ |
| related_id | INTEGER | NULL |  |  | 関連リソースID |
| related_type | VARCHAR(50) | NULL |  |  | 関連リソースタイプ |
| action_url | VARCHAR(500) | NULL |  |  | アクションURL |
| is_read | BOOLEAN | NOT NULL | false |  | 既読フラグ |
| read_at | TIMESTAMP | NULL |  |  | 既読日時 |
| priority | VARCHAR(20) | NOT NULL | 'normal' | CHECK (priority IN ('low', 'normal', 'high', 'urgent')) | 優先度 |
| expires_at | TIMESTAMP | NULL |  |  | 有効期限 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |

**インデックス:**
- `idx_notifications_user_id` ON user_id
- `idx_notifications_notification_type` ON notification_type
- `idx_notifications_is_read` ON is_read
- `idx_notifications_created_at` ON created_at
- `idx_notifications_expires_at` ON expires_at

---

## 8. システム管理

### 8.1 system_settings（システム設定）
システム全体の設定を管理するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | 設定ID（自動採番） |
| setting_key | VARCHAR(100) | NOT NULL |  | UNIQUE | 設定キー |
| setting_value | TEXT | NULL |  |  | 設定値 |
| setting_type | VARCHAR(20) | NOT NULL | 'string' | CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'date')) | 設定値の型 |
| description | TEXT | NULL |  |  | 設定説明 |
| is_public | BOOLEAN | NOT NULL | false |  | 公開設定（フロントエンドから参照可能） |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 更新日時 |

**インデックス:**
- `idx_system_settings_setting_key` ON setting_key
- `idx_system_settings_is_public` ON is_public

### 8.2 audit_logs（監査ログ）
システムの重要な操作履歴を記録するテーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ログID（自動採番） |
| user_id | INTEGER | NULL |  | FOREIGN KEY (users.id) ON DELETE SET NULL | 実行ユーザーID |
| action | VARCHAR(100) | NOT NULL |  |  | 実行アクション |
| entity_type | VARCHAR(50) | NOT NULL |  |  | 対象エンティティタイプ |
| entity_id | INTEGER | NULL |  |  | 対象エンティティID |
| old_values | TEXT | NULL |  |  | 変更前の値（JSON形式） |
| new_values | TEXT | NULL |  |  | 変更後の値（JSON形式） |
| ip_address | INET | NULL |  |  | 実行元IPアドレス |
| user_agent | TEXT | NULL |  |  | ユーザーエージェント |
| session_id | VARCHAR(255) | NULL |  |  | セッションID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | 実行日時 |

**インデックス:**
- `idx_audit_logs_user_id` ON user_id
- `idx_audit_logs_action` ON action
- `idx_audit_logs_entity_type` ON entity_type
- `idx_audit_logs_created_at` ON created_at

### 8.3 file_uploads（ファイルアップロード）
アップロードされたファイルの管理テーブル

| カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|---------|---------|------|-----------|-----|------|
| id | SERIAL | NOT NULL |  | PRIMARY KEY | ファイルID（自動採番） |
| user_id | INTEGER | NOT NULL |  | FOREIGN KEY (users.id) ON DELETE CASCADE | アップロードユーザーID |
| original_filename | VARCHAR(255) | NOT NULL |  |  | 元のファイル名 |
| stored_filename | VARCHAR(255) | NOT NULL |  |  | 保存時ファイル名 |
| file_path | VARCHAR(500) | NOT NULL |  |  | ファイルパス |
| file_size | BIGINT | NOT NULL |  |  | ファイルサイズ（バイト） |
| mime_type | VARCHAR(100) | NOT NULL |  |  | MIMEタイプ |
| file_hash | VARCHAR(64) | NOT NULL |  |  | ファイルハッシュ（SHA-256） |
| entity_type | VARCHAR(50) | NULL |  |  | 関連エンティティタイプ |
| entity_id | INTEGER | NULL |  |  | 関連エンティティID |
| is_temporary | BOOLEAN | NOT NULL | false |  | 一時ファイルフラグ |
| is_processed | BOOLEAN | NOT NULL | true |  | 処理完了フラグ |
| download_count | INTEGER | NOT NULL | 0 |  | ダウンロード回数 |
| expires_at | TIMESTAMP | NULL |  |  | 有効期限（一時ファイル用） |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP |  | アップロード日時 |

**インデックス:**
- `idx_file_uploads_user_id` ON user_id
- `idx_file_uploads_file_hash` ON file_hash
- `idx_file_uploads_entity_type_id` ON (entity_type, entity_id)
- `idx_file_uploads_is_temporary` ON is_temporary
- `idx_file_uploads_expires_at` ON expires_at

---

## データベース運用に関する注意事項

### パフォーマンス最適化
- 主要な検索条件に対してインデックスを設定
- 大容量が予想されるテーブル（audit_logs、user_material_access等）には適切なパーティショニングを検討
- 定期的なVACUUMとANALYZEの実行

### セキュリティ
- パスワードハッシュはbcryptを使用
- 個人情報を含むテーブルへのアクセス制御を適切に設定
- ファイルアップロードのセキュリティチェック

### バックアップ・リストア
- 日次フルバックアップの実行
- 重要なデータ変更前の差分バックアップ
- 定期的なリストアテストの実施

### データ保持ポリシー
- 監査ログは2年間保持
- 一時ファイルは30日後に自動削除
- 非アクティブユーザーのデータ保持期間の定義

---

**作成日**: 2025年1月31日  
**バージョン**: 1.0  
**対象システム**: 学習管理システム（LMS）