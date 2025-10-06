# Requirements Document

## Introduction

PostgreSQLデータベースのポート番号を標準ポート（5432）から非標準ポート（15432）へ変更するインフラ設定の移行を実施します。この変更は、ポート競合の回避やセキュリティ上の理由により必要とされています。

本変更は、開発環境、テスト環境、および関連するすべての設定ファイル、ドキュメント、接続文字列に影響を与えます。システムの稼働を維持しながら、すべてのコンポーネントが新しいポート番号で正常に動作することを保証します。

## Requirements

### Requirement 1: 開発環境のPostgreSQLポート変更
**Objective:** インフラ管理者として、開発環境のPostgreSQLポート番号を5432から15432に変更したい。これにより、ポート競合を回避し、セキュリティを向上させる。

#### Acceptance Criteria

1. WHEN Docker Compose開発環境が起動される THEN PostgreSQLコンテナ SHALL ホストポート15432でリッスンする
2. WHEN バックエンドアプリケーションが開発環境で起動される THEN データベース接続 SHALL ポート15432を使用して確立される
3. IF 環境変数POSTGRES_PORTが設定されていない THEN システム SHALL デフォルト値15432を使用する
4. WHEN Prismaマイグレーションが実行される THEN 接続文字列 SHALL 新しいポート15432を反映する

### Requirement 2: テスト環境のPostgreSQLポート変更
**Objective:** QAエンジニアとして、テスト環境のPostgreSQLポート番号を適切に変更したい。これにより、E2Eテストが新しい環境構成で正常に実行される。

#### Acceptance Criteria

1. WHEN Docker Composeテスト環境が起動される THEN PostgreSQLコンテナ SHALL ホストポート15433でリッスンする
2. WHEN E2Eテストが実行される THEN バックエンドテストサービス SHALL ポート15433経由でデータベースに接続する
3. IF MCPサーバーがテスト環境で起動される THEN データベース接続 SHALL 新しいポート15433を使用する
4. WHEN テスト用シードデータが投入される THEN Prisma SHALL 正しいポート番号でデータベースにアクセスする

### Requirement 3: 環境変数とサンプル設定の更新
**Objective:** 開発者として、環境変数テンプレートとサンプル設定が新しいポート番号を反映していることを確認したい。これにより、新規開発者が正しい設定で環境をセットアップできる。

#### Acceptance Criteria

1. WHEN .env.exampleファイルが参照される THEN POSTGRES_PORT値 SHALL 15432に設定されている
2. WHEN DATABASE_URLサンプルが表示される THEN 接続文字列 SHALL ポート15432を含む
3. WHEN 開発環境ポート一覧が記載される THEN ドキュメント SHALL "postgres=15432"を明記する
4. WHEN テスト環境ポート一覧が記載される THEN ドキュメント SHALL "postgres=15433"を明記する

### Requirement 4: Docker Compose設定の更新
**Objective:** DevOpsエンジニアとして、Docker Compose設定ファイルが新しいポート番号を正しく反映していることを保証したい。これにより、コンテナ起動時にポート競合が発生しない。

#### Acceptance Criteria

1. WHEN docker-compose.ymlが読み込まれる THEN postgresサービス SHALL "15432:5432"のポートマッピングを定義する
2. WHEN docker-compose.test.ymlが読み込まれる THEN db-testサービス SHALL "15433:5432"のポートマッピングを定義する
3. WHEN 環境変数POSTGRES_PORTが指定される THEN Docker Compose SHALL その値をホストポートとして使用する
4. WHEN DATABASE_URL環境変数がバックエンドに渡される THEN 接続文字列 SHALL コンテナ内部ポート5432を含む（変更なし）

### Requirement 5: ドキュメントとガイドの更新
**Objective:** 開発チームメンバーとして、すべてのドキュメントが最新のポート設定を反映していることを確認したい。これにより、混乱を避け、正確な情報に基づいて作業できる。

#### Acceptance Criteria

1. WHEN README.mdのクイックスタートガイドが参照される THEN PostgreSQLアクセス情報 SHALL "localhost:15432"を表示する
2. WHEN サービスポート一覧表が表示される THEN postgresポート SHALL 15432（開発）/ 15433（テスト）と記載される
3. WHEN backend/README.mdのデータベース設定が参照される THEN 接続文字列例 SHALL ポート15432を含む
4. WHEN .kiro/steering/tech.mdの技術スタックが参照される THEN PostgreSQLポート設定 SHALL 15432/15433に更新される

### Requirement 6: ポートチェックスクリプトの更新
**Objective:** 開発者として、ポートチェックスクリプトが新しいポート番号を検証できることを確認したい。これにより、環境起動前にポート競合を検出できる。

#### Acceptance Criteria

1. WHEN `node scripts/check-ports.js development`が実行される THEN スクリプト SHALL ポート15432の利用可能性を確認する
2. WHEN `node scripts/check-ports.js test`が実行される THEN スクリプト SHALL ポート15433の利用可能性を確認する
3. IF ポート15432が使用中である THEN スクリプト SHALL エラーメッセージを表示して終了する
4. IF ポート15433が使用中である THEN スクリプト SHALL エラーメッセージを表示して終了する

### Requirement 7: 既存システムとの互換性確保
**Objective:** システム管理者として、既存の開発環境とデータが新しいポート設定でも正常に動作することを保証したい。これにより、既存のデータベースボリュームを保持しながら移行できる。

#### Acceptance Criteria

1. WHEN 既存のpostgres-dataボリュームが存在する THEN 新しいポート設定 SHALL 既存データにアクセス可能である
2. WHEN Prisma Studioが起動される THEN DATABASE_URL SHALL 新しいポート15432経由でデータベースに接続する
3. WHEN バックエンドのヘルスチェックが実行される THEN データベース接続確認 SHALL 成功する
4. WHEN docker compose downとdocker compose upが実行される THEN すべてのサービス SHALL 新しいポート設定で正常に起動する

### Requirement 8: バックワード互換性とロールバック対策
**Objective:** 運用担当者として、問題発生時に旧ポート設定へ迅速にロールバックできる仕組みを確保したい。これにより、システム停止時間を最小限に抑える。

#### Acceptance Criteria

1. WHEN 環境変数POSTGRES_PORTが明示的に5432に設定される THEN システム SHALL 旧ポート設定で動作する
2. IF 新ポート設定で問題が発生する THEN .env.exampleの値を変更するだけで SHALL 旧設定に戻せる
3. WHEN ドキュメントにロールバック手順が記載される THEN 手順 SHALL 環境変数変更とコンテナ再起動のみで完了する
4. WHERE 本番環境デプロイ前 THE チーム SHALL ステージング環境で新ポート設定の動作を検証する
