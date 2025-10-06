# Technical Design Document

## Overview

PostgreSQLデータベースのポート番号を標準ポート（5432）から非標準ポート（15432）へ変更するインフラ設定の移行を実施します。この変更は既存のDocker環境、環境変数、設定ファイル、ドキュメントに影響を与える横断的なインフラ変更です。

**目的**: ポート競合の回避とセキュリティ上の理由により、PostgreSQLのホストポート番号を変更し、開発環境とテスト環境で新しいポート設定が正常に動作することを保証します。

**影響を受けるユーザー**: 開発者、QAエンジニア、インフラ管理者、新規プロジェクト参加者が、環境セットアップ時およびDocker環境操作時にこの変更の影響を受けます。

**システムへの影響**: この変更は既存のDocker Compose設定、環境変数テンプレート、接続文字列、ポートチェックスクリプト、プロジェクトドキュメントを更新します。コンテナ内部のPostgreSQLポート（5432）は変更せず、ホスト側のポートマッピングのみを変更します。

### Goals

- 開発環境のPostgreSQLホストポートを5432から15432へ変更
- テスト環境のPostgreSQLホストポートを5433から15433へ変更
- すべての設定ファイル、ドキュメント、スクリプトを新しいポート番号に更新
- 既存のデータベースボリュームとの互換性を維持
- 環境変数による柔軟なポート設定とロールバック機能の確保

### Non-Goals

- PostgreSQLコンテナ内部ポート（5432）の変更は行わない
- 本番環境のポート設定は対象外（開発・テスト環境のみ）
- データベースデータの移行やマイグレーションは不要
- 既存のPrismaスキーマやデータモデルの変更は不要
- 新しいデータベース機能の追加は対象外

## Architecture

### 既存アーキテクチャ分析

**現在のポート構成**:
```
開発環境:
- Frontend: 3000
- Backend: 5000
- PostgreSQL: 5432 → 15432（変更対象）
- Redis: 6379

テスト環境:
- Frontend: 3002
- Backend: 3001
- PostgreSQL: 5433 → 15433（変更対象）
- MCP Server: 3003
```

**既存の設計パターン**:
- Docker Composeによるマルチサービス管理
- 環境変数ベースの設定管理（.env.example テンプレート）
- ポートマッピング: `${HOST_PORT}:${CONTAINER_PORT}` パターン
- ポートチェックスクリプトによる事前検証

**保持すべき制約**:
- コンテナ内部ポート（5432）は変更しない
- 環境変数によるポート設定のオーバーライド機能
- 既存のDockerボリューム（postgres-data）との互換性
- DATABASE_URL接続文字列の形式

### 高-Level Architecture

```mermaid
graph TB
    subgraph "開発環境 (docker-compose.yml)"
        DEV_FRONTEND[Frontend:3000]
        DEV_BACKEND[Backend:5000]
        DEV_POSTGRES[PostgreSQL<br/>Host:15432→Container:5432]
        DEV_REDIS[Redis:6379]
    end

    subgraph "テスト環境 (docker-compose.test.yml)"
        TEST_FRONTEND[Frontend:3002]
        TEST_BACKEND[Backend:3001]
        TEST_POSTGRES[PostgreSQL<br/>Host:15433→Container:5432]
        TEST_MCP[MCP Server:3003]
    end

    subgraph "設定ファイル"
        ENV[.env.example<br/>POSTGRES_PORT=15432]
        DOCKER_DEV[docker-compose.yml<br/>15432:5432]
        DOCKER_TEST[docker-compose.test.yml<br/>15433:5432]
        CHECK_SCRIPT[check-ports.js<br/>ポート検証]
    end

    subgraph "ドキュメント"
        README[README.md]
        BACKEND_DOC[backend/README.md]
        TECH_STEERING[.kiro/steering/tech.md]
    end

    ENV -->|設定| DOCKER_DEV
    ENV -->|設定| DOCKER_TEST
    CHECK_SCRIPT -->|検証| DEV_POSTGRES
    CHECK_SCRIPT -->|検証| TEST_POSTGRES

    DEV_BACKEND -->|接続| DEV_POSTGRES
    TEST_BACKEND -->|接続| TEST_POSTGRES
    TEST_MCP -->|接続| TEST_POSTGRES
```

### 技術スタック整合性

**既存技術スタックとの整合**:
- Docker Compose v2.0+: ポートマッピング構文は既存パターンを踏襲
- PostgreSQL 16-alpine: コンテナイメージは変更なし
- Node.js 20+: ポートチェックスクリプトの実行環境
- Prisma ORM: DATABASE_URL環境変数を通じた接続（変更パターン適用）

**新規依存関係**: なし（既存ツールチェーンのみ使用）

**ステアリング遵守**:
- `.kiro/steering/structure.md`: 設定ファイル配置規則を遵守
- `.kiro/steering/tech.md`: 環境変数パターンとDocker構成を遵守
- ポート管理規則の更新が必要（tech.md内のポート一覧）

### 主要設計判断

#### 判断1: ホストポートのみ変更、コンテナ内部ポートは維持

**コンテキスト**: PostgreSQLのポート番号変更において、コンテナ内部ポート（5432）を変更するか、ホストポートマッピングのみを変更するかの選択が必要です。

**検討した代替案**:
1. コンテナ内部ポートも変更（例: 15432:15432）
2. ホストポートのみ変更（例: 15432:5432）- 選択
3. 環境変数で両方制御可能にする

**選択したアプローチ**: ホストポート（15432）とコンテナポート（5432）のマッピングを維持

**根拠**:
- PostgreSQL公式イメージはデフォルトで5432ポートを使用
- コンテナ内のアプリケーション（Prisma、ヘルスチェック）は標準ポート5432を期待
- DATABASE_URL内のポート番号（コンテナ間通信）は変更不要
- 変更箇所を最小限に抑え、リスクを低減

**トレードオフ**:
- 獲得: 変更範囲の最小化、既存設定との互換性、標準的なDocker パターン
- 犠牲: ホストとコンテナのポート不一致による若干の認知負荷

#### 判断2: テスト環境ポートを5433から15433へ変更

**コンテキスト**: テスト環境のPostgreSQLポートは現在5433を使用しており、開発環境との整合性を保つための変更戦略が必要です。

**検討した代替案**:
1. テスト環境はそのまま5433を維持
2. テスト環境を15433に変更（開発環境+1パターン維持）- 選択
3. テスト環境を16432など別の番号体系に変更

**選択したアプローチ**: テスト環境を15433に変更（開発環境15432 + 1）

**根拠**:
- 現在のパターン（開発5432、テスト5433）を新しいポート範囲でも維持
- ポート番号の規則性により、環境の識別が容易
- .env.exampleのコメント「テスト環境は開発環境+1000番台」パターンとの整合性

**トレードオフ**:
- 獲得: 一貫したポート番号規則、環境間の明確な区別
- 犠牲: テスト環境も変更が必要（影響範囲の拡大）

#### 判断3: 環境変数によるロールバック機能の実装

**コンテキスト**: 新ポート設定で問題が発生した場合、迅速にロールバックできる仕組みが運用上必要です。

**検討した代替案**:
1. Git revertによるファイルレベルのロールバック
2. 環境変数オーバーライドによる設定レベルのロールバック - 選択
3. 複数のdocker-compose設定ファイルを用意

**選択したアプローチ**: 環境変数POSTGRES_PORTによる柔軟な設定とロールバック

**根拠**:
- .envファイルの値変更のみで即座にロールバック可能
- docker-compose.ymlは`${POSTGRES_PORT:-15432}`パターンを使用
- コンテナ再起動のみで設定変更が適用される
- 開発者ごとに異なるポート設定も可能

**トレードオフ**:
- 獲得: 迅速なロールバック、環境固有の設定柔軟性、運用の安全性
- 犠牲: デフォルト値の管理（docker-compose.yml と .env.example の同期）

## System Flows

### ポート変更適用フロー

```mermaid
graph TB
    START([開発者が環境起動])
    CHECK_SCRIPT[check-ports.jsスクリプト実行]
    CHECK_15432{ポート15432<br/>使用可能?}
    CHECK_15433{ポート15433<br/>使用可能?}
    ERROR_MSG[ポート競合エラー表示<br/>対処方法を提示]
    READ_ENV[.envファイル読み込み<br/>POSTGRES_PORT取得]
    COMPOSE_START[docker-compose起動<br/>ポートマッピング適用]
    POSTGRES_START[PostgreSQLコンテナ起動<br/>15432:5432マッピング]
    BACKEND_CONNECT[バックエンド起動<br/>DATABASE_URL接続]
    DB_READY[データベース接続確認<br/>ヘルスチェック成功]
    SUCCESS([環境起動成功])

    START --> CHECK_SCRIPT
    CHECK_SCRIPT --> CHECK_15432
    CHECK_15432 -->|開発環境| CHECK_15433
    CHECK_15432 -->|使用中| ERROR_MSG
    CHECK_15433 -->|テスト環境| READ_ENV
    CHECK_15433 -->|使用中| ERROR_MSG
    ERROR_MSG --> START
    READ_ENV --> COMPOSE_START
    COMPOSE_START --> POSTGRES_START
    POSTGRES_START --> BACKEND_CONNECT
    BACKEND_CONNECT --> DB_READY
    DB_READY --> SUCCESS
```

### ロールバックフロー

```mermaid
graph TB
    START([新ポート設定で問題発生])
    EDIT_ENV[.env.exampleの<br/>POSTGRES_PORT=5432に変更]
    STOP_CONTAINERS[docker compose down実行]
    START_CONTAINERS[docker compose up実行]
    VERIFY[ポート5432での<br/>接続確認]
    SUCCESS([旧設定で復旧完了])

    START --> EDIT_ENV
    EDIT_ENV --> STOP_CONTAINERS
    STOP_CONTAINERS --> START_CONTAINERS
    START_CONTAINERS --> VERIFY
    VERIFY --> SUCCESS
```

## Requirements Traceability

| 要件ID | 要件概要 | 実装コンポーネント | 設定ファイル | 関連フロー |
|--------|----------|-------------------|-------------|-----------|
| 1.1-1.4 | 開発環境ポート変更 | Docker Compose開発環境 | docker-compose.yml, .env.example | ポート変更適用フロー |
| 2.1-2.4 | テスト環境ポート変更 | Docker Composeテスト環境 | docker-compose.test.yml | ポート変更適用フロー |
| 3.1-3.4 | 環境変数更新 | 環境変数テンプレート | .env.example | - |
| 4.1-4.4 | Docker Compose設定 | ポートマッピング設定 | docker-compose.yml, docker-compose.test.yml | ポート変更適用フロー |
| 5.1-5.4 | ドキュメント更新 | プロジェクトドキュメント | README.md, backend/README.md, tech.md | - |
| 6.1-6.4 | ポートチェック更新 | ポート検証スクリプト | scripts/check-ports.js | ポート変更適用フロー |
| 7.1-7.4 | 互換性確保 | Dockerボリューム、DB接続 | docker-compose.yml (volumes) | ポート変更適用フロー |
| 8.1-8.4 | ロールバック対策 | 環境変数オーバーライド | .env.example, docker-compose.yml | ロールバックフロー |

## Components and Interfaces

### インフラ設定層

#### Docker Compose開発環境設定

**責任と境界**
- **主要責任**: 開発環境のPostgreSQLコンテナのホストポートマッピングを15432に設定
- **ドメイン境界**: インフラストラクチャ層（開発環境）
- **データ所有権**: Docker Composeサービス定義とボリューム設定
- **トランザクション境界**: コンテナライフサイクル管理

**依存関係**
- **インバウンド**: 開発者のdocker compose upコマンド、check-ports.jsスクリプト
- **アウトバウンド**: PostgreSQL公式イメージ、postgresデータボリューム
- **外部**: Docker Engine、ホストOS のネットワークスタック

**設定契約**

**docker-compose.yml - postgresサービス**:
```yaml
postgres:
  image: postgres:16-alpine
  ports:
    - "${POSTGRES_PORT:-15432}:5432"
  environment:
    - POSTGRES_USER=${POSTGRES_USER:-lms_user}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-lms_password}
    - POSTGRES_DB=${POSTGRES_DB:-lms_db}
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

- **事前条件**: ホストポート15432が利用可能、Docker Engineが起動中
- **事後条件**: PostgreSQLコンテナがホストポート15432でリッスン、コンテナ内部は5432
- **不変条件**: コンテナ内部ポート5432は常に固定、ボリュームマウントは維持

**統合戦略**:
- **変更アプローチ**: 既存docker-compose.ymlのports設定を拡張（デフォルト値変更）
- **後方互換性**: 環境変数POSTGRES_PORTでオーバーライド可能（5432も設定可）
- **移行パス**: デフォルト値変更のみ、既存.envファイルは優先される

#### Docker Composeテスト環境設定

**責任と境界**
- **主要責任**: テスト環境のPostgreSQLコンテナのホストポートマッピングを15433に設定
- **ドメイン境界**: インフラストラクチャ層（テスト環境）
- **データ所有権**: テスト用データベースサービス定義
- **トランザクション境界**: テストコンテナライフサイクル管理

**依存関係**
- **インバウンド**: E2Eテストランナー、MCPサーバー、バックエンドテストサービス
- **アウトバウンド**: PostgreSQL公式イメージ、postgres_test_dataボリューム
- **外部**: Playwrightテストフレームワーク、Docker Engine

**設定契約**

**docker-compose.test.yml - db-testサービス**:
```yaml
db-test:
  image: postgres:16-alpine
  ports:
    - "15433:5432"
  environment:
    - POSTGRES_USER=${DB_USER:-lmsuser}
    - POSTGRES_PASSWORD=${DB_PASSWORD:-lmspassword}
    - POSTGRES_DB=${DB_NAME:-lms_test}
  volumes:
    - postgres_test_data:/var/lib/postgresql/data
```

- **事前条件**: ホストポート15433が利用可能、開発環境と分離
- **事後条件**: テスト用PostgreSQLコンテナが15433でリッスン
- **不変条件**: テストデータ分離、コンテナ内部ポート5432固定

**統合戦略**:
- **変更アプローチ**: portsマッピングを"5433:5432"から"15433:5432"に変更
- **後方互換性**: テスト環境は固定ポートのため環境変数なし
- **移行パス**: 直接的なポート番号変更、テストスクリプトへの影響なし

#### 環境変数テンプレート

**責任と境界**
- **主要責任**: 新規開発者向けの正しいポート設定例を提供
- **ドメイン境界**: 設定管理層
- **データ所有権**: 環境変数のデフォルト値とサンプル
- **トランザクション境界**: N/A（静的設定ファイル）

**依存関係**
- **インバウンド**: 開発者の環境セットアップ、.envファイル生成
- **アウトバウンド**: Docker Compose、バックエンドアプリケーション
- **外部**: なし

**設定契約**

**.env.example - PostgreSQL関連設定**:
```bash
# Database Configuration
DATABASE_URL=postgresql://lms_user:lms_password@postgres:15432/lms_db
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=lms_password
POSTGRES_DB=lms_db
POSTGRES_PORT=15432

# Port Management
# Development environment: frontend=3000, backend=5000, postgres=15432, redis=6379
# Test environment: frontend=3002, backend=3001, postgres=15433, mcp=3003
```

- **事前条件**: なし（テンプレートファイル）
- **事後条件**: 開発者が正しいポート設定でコピー可能
- **不変条件**: DATABASE_URLのホスト名は"postgres"（Docker内部DNS）

#### ポートチェックスクリプト

**責任と境界**
- **主要責任**: 環境起動前にPostgreSQLポート（15432/15433）の利用可能性を検証
- **ドメイン境界**: インフラストラクチャ検証層
- **データ所有権**: ポート設定の検証結果
- **トランザクション境界**: スクリプト実行単位

**依存関係**
- **インバウンド**: npm run docker:up/docker:test スクリプト
- **アウトバウンド**: ホストOSのネットワークスタック、Docker CLI
- **外部**: Node.js ランタイム、ssコマンド（Linux）

**スクリプト契約**

**scripts/check-ports.js - DEFAULT_PORTS設定**:
```javascript
const DEFAULT_PORTS = {
  frontend: 3000,
  backend: 5000,
  postgres: 15432,        // 変更: 5432 → 15432
  redis: 6379,
  frontend_test: 3002,
  backend_test: 3001,
  postgres_test: 15433,   // 変更: 5433 → 15433
  mcp_server: 3003
};
```

- **事前条件**: Node.js実行環境、ssコマンド利用可能
- **事後条件**: ポート競合がある場合は終了コード1、なければ0
- **不変条件**: .envファイルの値が優先される

**エラー処理**:
```javascript
// ポート競合検出時
if (inUse) {
  console.log(`❌ Port ${port} (${service}) is already in use`);
  // Docker コンテナ特定
  const container = await getDockerContainerUsingPort(port);
  if (container) {
    console.log(`   Used by Docker container: ${container}`);
    console.log(`   To free this port, run: docker stop ${container}`);
  }
  process.exit(1);
}
```

### ドキュメント層

#### プロジェクトREADME

**責任と境界**
- **主要責任**: クイックスタートガイドとサービスポート一覧の正確性
- **ドメイン境界**: プロジェクトドキュメント層
- **データ所有権**: ユーザー向け設定情報
- **トランザクション境界**: N/A（ドキュメント）

**更新契約**

**README.md - 更新箇所**:
| セクション | 現在の記載 | 更新後 |
|----------|----------|--------|
| クイックスタートガイド | `PostgreSQL: localhost:5432` | `PostgreSQL: localhost:15432` |
| サービスポート一覧表 | `postgres | 5432 | PostgreSQL database` | `postgres | 15432 (dev) / 15433 (test) | PostgreSQL database` |

#### バックエンドREADME

**責任と境界**
- **主要責任**: バックエンド開発者向けのデータベース接続設定例
- **ドメイン境界**: バックエンドドキュメント層
- **データ所有権**: データベース接続文字列の例
- **トランザクション境界**: N/A（ドキュメント）

**更新契約**

**backend/README.md - DATABASE_URL例**:
```bash
# 現在
DATABASE_URL=postgresql://username:password@localhost:5432/lms_db

# 更新後
DATABASE_URL=postgresql://username:password@localhost:15432/lms_db
```

#### 技術ステアリングドキュメント

**責任と境界**
- **主要責任**: 技術スタックとアーキテクチャ上のポート設定の文書化
- **ドメイン境界**: ステアリングドキュメント層
- **データ所有権**: 標準ポート設定の定義
- **トランザクション境界**: N/A（ステアリング）

**更新契約**

**.kiro/steering/tech.md - ポート設定セクション**:
```markdown
## ポート管理

### 開発環境
- Frontend: 3000
- Backend: 5000
- PostgreSQL: 15432  # 変更: 5432 → 15432
- Redis: 6379

### テスト環境
- Frontend: 3002
- Backend: 3001
- PostgreSQL: 15433  # 変更: 5433 → 15433
- MCP: 3003
```

## Error Handling

### エラー戦略

PostgreSQLポート変更における主要なエラーシナリオとその対応策を定義します。エラーは環境起動時の検証エラー、接続エラー、設定不整合の3カテゴリに分類されます。

### エラーカテゴリと対応

#### ポート競合エラー（環境起動前）

**シナリオ**: check-ports.jsスクリプトがポート15432または15433が使用中であることを検出

**検出方法**:
```javascript
// scripts/check-ports.js
const inUse = await checkPort(port);
if (inUse) {
  const container = await getDockerContainerUsingPort(port);
  // エラーメッセージ表示
}
```

**エラーレスポンス**:
```
❌ Port 15432 (postgres) is already in use
   Used by Docker container: lms-postgres
   To free this port, run: docker stop lms-postgres

🚨 Port conflicts detected!

Suggested actions:
1. Stop conflicting containers: docker compose down
2. Stop test containers: npm run docker:test:down
3. Check all running containers: docker ps
4. Use different ports by creating a .env file
```

**リカバリ手順**:
1. 表示されたDockerコンテナを停止: `docker stop <container-name>`
2. または開発環境全体を停止: `docker compose down`
3. ポートチェック再実行: `node scripts/check-ports.js development`

#### データベース接続エラー（起動時）

**シナリオ**: バックエンドが新しいポート15432でPostgreSQLに接続できない

**検出ポイント**:
- Prisma接続初期化時
- バックエンドヘルスチェックエンドポイント（/api/v1/health）
- docker-compose.ymlのヘルスチェック

**エラーメッセージ例**:
```
Error: P1001: Can't reach database server at `postgres:15432`
Please make sure your database server is running at `postgres:15432`.
```

**診断手順**:
1. PostgreSQLコンテナ状態確認: `docker ps | grep postgres`
2. コンテナログ確認: `docker logs lms-postgres`
3. ポートマッピング確認: `docker port lms-postgres`
4. 環境変数確認: `docker exec lms-backend env | grep DATABASE_URL`

**リカバリ手順**:
1. コンテナ再起動: `docker compose restart postgres backend`
2. DATABASE_URL検証: 接続文字列が正しいポート番号を含むか確認
3. ロールバック実行: 環境変数を5432に戻して再起動

#### 設定不整合エラー

**シナリオ1**: .env.exampleと実際の.envファイルのポート番号が不一致

**検出方法**: 手動確認またはポートチェックスクリプトの出力比較

**対応策**:
```bash
# .envファイルを.env.exampleから再生成
cp .env.example .env
# 必要に応じてカスタム設定を追加
```

**シナリオ2**: docker-compose.ymlのデフォルト値と.env.exampleが不一致

**検出方法**: コードレビューまたは環境起動テスト

**対応策**:
- docker-compose.yml: `${POSTGRES_PORT:-15432}` のデフォルト値確認
- .env.example: `POSTGRES_PORT=15432` の値確認
- 両ファイルの同期を維持

### モニタリング

#### ポート利用状況の監視

**確認コマンド**:
```bash
# 開発環境のポート確認
node scripts/check-ports.js development

# テスト環境のポート確認
node scripts/check-ports.js test

# すべてのDockerコンテナポート確認
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

#### データベース接続の監視

**ヘルスチェック**:
```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lms_user} -d ${POSTGRES_DB:-lms_db}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

**バックエンドヘルスチェックエンドポイント**:
```
GET /api/v1/health
Response: { "status": "ok", "database": "connected" }
```

#### ログ監視

**PostgreSQLコンテナログ**:
```bash
# リアルタイムログ確認
docker logs -f lms-postgres

# エラーログのみ抽出
docker logs lms-postgres 2>&1 | grep -i error
```

**バックエンドログ**:
```bash
# データベース接続ログ確認
docker logs lms-backend | grep -i "database\|postgres\|prisma"
```

## Testing Strategy

### ユニットテスト

**ポートチェックスクリプトのテスト**:
1. **ポート検出機能**: `checkPort(15432)` が使用中ポートを正しく検出
2. **Dockerコンテナ特定**: `getDockerContainerUsingPort(15432)` がコンテナ名を返却
3. **環境変数読み込み**: `getPortConfig()` が.envから正しくポート番号を取得
4. **デフォルト値適用**: 環境変数未設定時に15432/15433がデフォルト値として使用される
5. **モード別ポート選択**: 開発モードとテストモードで正しいポートセットを選択

### 統合テスト

**Docker Compose環境テスト**:
1. **開発環境起動**: `docker compose up -d` でPostgreSQLがポート15432で起動
2. **テスト環境起動**: `docker compose -f docker-compose.test.yml up -d` でPostgreSQLがポート15433で起動
3. **バックエンド接続**: バックエンドコンテナが正しいポートでDB接続確立
4. **Prismaマイグレーション**: 新ポート経由でマイグレーション成功
5. **ヘルスチェック**: PostgreSQLヘルスチェックが成功

### E2Eテスト

**環境セットアップフロー**:
1. **クリーン環境構築**: ポートチェック → Docker起動 → DB接続確認の全フロー
2. **E2Eテスト実行**: Playwrightテストがテスト環境（15433）経由で正常実行
3. **データシード**: E2E用シードデータが新ポート経由で投入成功
4. **MCPサーバー接続**: MCPサーバーがテストDBに正しく接続
5. **環境クリーンアップ**: `docker compose down` で全コンテナ停止

### ロールバックテスト

**旧ポート設定への復元**:
1. **環境変数変更**: `.env` で `POSTGRES_PORT=5432` に設定
2. **コンテナ再起動**: `docker compose down && docker compose up -d`
3. **ポート5432確認**: PostgreSQLがポート5432でリッスン
4. **既存データ確認**: postgres-dataボリュームのデータが保持されている

## Migration Strategy

### 移行フェーズ

```mermaid
graph TB
    START([移行開始])
    PHASE1[Phase 1: 設定ファイル更新]
    PHASE2[Phase 2: ドキュメント更新]
    PHASE3[Phase 3: 環境検証]
    PHASE4[Phase 4: チーム展開]

    VALIDATE1{設定ファイル<br/>整合性確認}
    VALIDATE2{ドキュメント<br/>完全性確認}
    VALIDATE3{環境起動<br/>テスト成功?}
    VALIDATE4{チーム全体<br/>移行完了?}

    ROLLBACK1[設定ロールバック]
    ROLLBACK2[ドキュメント復元]
    ROLLBACK3[環境ロールバック]
    ROLLBACK4[段階的復元]

    SUCCESS([移行完了])

    START --> PHASE1

    PHASE1 --> VALIDATE1
    VALIDATE1 -->|OK| PHASE2
    VALIDATE1 -->|NG| ROLLBACK1
    ROLLBACK1 --> PHASE1

    PHASE2 --> VALIDATE2
    VALIDATE2 -->|OK| PHASE3
    VALIDATE2 -->|NG| ROLLBACK2
    ROLLBACK2 --> PHASE2

    PHASE3 --> VALIDATE3
    VALIDATE3 -->|OK| PHASE4
    VALIDATE3 -->|NG| ROLLBACK3
    ROLLBACK3 --> PHASE1

    PHASE4 --> VALIDATE4
    VALIDATE4 -->|OK| SUCCESS
    VALIDATE4 -->|NG| ROLLBACK4
    ROLLBACK4 --> PHASE3
```

### Phase 1: 設定ファイル更新

**実施内容**:
1. `.env.example` のPOSTGRES_PORT値を15432に更新
2. `docker-compose.yml` のpostgresサービスポートマッピングを"15432:5432"に変更
3. `docker-compose.test.yml` のdb-testポートマッピングを"15433:5432"に変更
4. `scripts/check-ports.js` のDEFAULT_PORTSを更新（postgres: 15432, postgres_test: 15433）

**検証チェックポイント**:
- [ ] .env.exampleとdocker-compose.ymlのデフォルト値が一致
- [ ] DATABASE_URLサンプルのポート番号が更新されている
- [ ] check-ports.jsのポート番号配列が更新されている
- [ ] テスト環境設定が開発環境と整合している

**ロールバックトリガー**:
- 設定ファイルの構文エラー
- Docker Compose検証失敗（`docker compose config`）
- ポート番号の不整合検出

### Phase 2: ドキュメント更新

**実施内容**:
1. `README.md` のPostgreSQLポート情報を更新
2. `backend/README.md` のDATABASE_URL例を更新
3. `.kiro/steering/tech.md` のポート設定セクションを更新

**検証チェックポイント**:
- [ ] すべてのドキュメントで5432→15432の更新が完了
- [ ] クイックスタートガイドが最新のポート番号を反映
- [ ] サービスポート一覧表が正確
- [ ] ステアリングドキュメントが技術スタックと整合

**ロールバックトリガー**:
- ドキュメントの重要な欠落
- 不正確なポート情報の記載

### Phase 3: 環境検証

**実施内容**:
1. 開発環境クリーン起動テスト
   ```bash
   docker compose down -v
   node scripts/check-ports.js development
   docker compose up -d
   docker logs lms-postgres
   docker logs lms-backend | grep -i "database connected"
   ```

2. テスト環境起動テスト
   ```bash
   docker compose -f docker-compose.test.yml down -v
   node scripts/check-ports.js test
   docker compose -f docker-compose.test.yml up -d
   npm run e2e
   ```

3. ロールバックテスト
   ```bash
   # .envでPOSTGRES_PORT=5432に変更
   docker compose down && docker compose up -d
   # ポート5432で起動確認
   ```

**検証チェックポイント**:
- [ ] ポートチェックスクリプトが新ポート番号を検証
- [ ] PostgreSQLが指定ポート（15432/15433）で起動
- [ ] バックエンドがデータベース接続確立
- [ ] E2Eテストが全て成功
- [ ] 既存データベースボリュームが保持される
- [ ] ロールバックが機能する

**ロールバックトリガー**:
- ポートチェック失敗
- データベース接続エラー
- E2Eテスト失敗
- データ損失の検出

### Phase 4: チーム展開

**実施内容**:
1. チームへの移行通知
   - 新ポート番号の案内（15432/15433）
   - `.env` ファイル更新手順の共有
   - トラブルシューティングガイドの提供

2. 段階的な個人環境移行
   ```bash
   # 各開発者が実施
   git pull origin main
   cp .env.example .env  # または既存.envのPOSTGRES_PORT更新
   docker compose down
   node scripts/check-ports.js development
   docker compose up -d
   ```

3. 移行状況の追跡
   - 各開発者の移行完了確認
   - 問題発生時のサポート
   - FAQ の更新

**検証チェックポイント**:
- [ ] 全開発者が新ポート設定で環境起動成功
- [ ] ポート競合問題が解消
- [ ] 既存の開発作業に影響なし
- [ ] FAQ が十分に整備されている

**ロールバックトリガー**:
- 複数の開発者で移行失敗
- 重大な互換性問題の発覚
- チーム全体の生産性低下

### ロールバック手順

**即座のロールバック**（Phase 3以前）:
```bash
# Git経由で設定ファイルを復元
git checkout HEAD~1 -- .env.example docker-compose.yml docker-compose.test.yml scripts/check-ports.js

# コンテナ再起動
docker compose down
docker compose up -d
```

**段階的ロールバック**（Phase 4）:
```bash
# 個別開発者の.env変更
POSTGRES_PORT=5432

# チーム全体へのアナウンス
# - 一時的に旧ポート設定に戻す
# - 問題解決後に再移行スケジュール
```

### 成功基準

移行が成功したと判断する基準:
- [ ] すべての設定ファイルが新ポート番号に更新されている
- [ ] すべてのドキュメントが正確な情報を記載している
- [ ] 開発環境とテスト環境が新ポートで正常起動する
- [ ] E2Eテストが全て成功する
- [ ] チーム全員が新設定で開発作業を継続できている
- [ ] ポート競合問題が解消されている
- [ ] ロールバック手順が検証済みである
