---
title: "【Drizzle】Cloud SQLにMigrationする【Github Actions】"
pubDate: 2025-06-07
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Drizzle

DrizzleはTypeScriptのDBライブラリです。ローカルでは通常pushを使いますが、本番ではgenerateとmigrateを使用するかと思います。

## Github Actions

下記、前提です。

*   DB: PostgreSQL
*   Package manager: PNPM
*   PNPM scriptにdb:migrateを追加。内容はdrizzle-kit migrate
*   drizzle-kit generateを実行済み
*   リポジトリの環境変数
    *   GCP\_SA\_KEY: サービスアカウントのjsonの中身
    *   DATABASE\_URL: postgresURL（postgresql://username:password@localhost:5432/db\_name）

他にも色々固有の値が入っていますが、ご容赦ください。AIで修正すれば簡単かと思います。

下記のようなyamlを使用します。

```yaml
# .github/workflows/deploy-cloud-run.yml

name: Deploy to Cloud Run

# Environment variables are set for build step to pass Zod validation
on:
  push:
    branches:
      - staging
    paths:
      - 'apps/web/**'
      - 'packages/**'
      - 'Dockerfile'
      - '.github/workflows/deploy-cloud-run.yml'

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: YOUR_SERVICE_NAME
  REGION: YOUR_REGION

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: 10.11.0

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Setup Cloud SQL Proxy
      run: |
        # Cloud SQL Proxyをダウンロード
        curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.linux.amd64
        chmod +x cloud-sql-proxy
        
        # TCP/IP接続でプロキシを起動（ポート5432でリッスン）
        echo "Starting Cloud SQL Proxy for $PROJECT_ID:$REGION:main-db"
        ./cloud-sql-proxy $PROJECT_ID:$REGION:main-db --port 5432 --structured-logs &
        PROXY_PID=$!
        
        # プロキシが起動するまで少し待つ
        sleep 15
        
        # プロキシが正常に起動したか確認
        echo "Checking if proxy is listening on port 5432..."
        netstat -ln | grep :5432 || echo "Port 5432 not found"
        
        # プロキシプロセスが生きているか確認
        if kill -0 $PROXY_PID 2>/dev/null; then
          echo "Cloud SQL Proxy is still running (PID: $PROXY_PID)"
        else
          echo "Cloud SQL Proxy process died"
        fi
        
        # 接続テスト
        echo "Testing connection to localhost:5432..."
        timeout 5 bash -c 'cat < /dev/null > /dev/tcp/localhost/5432' && echo "Connection successful" || echo "Connection failed"

    - name: Run database migrations
      run: |
        cd packages/lib/db
        echo "Running database migrations..."
        pnpm db:migrate
        
        # マイグレーション後にテーブル一覧を確認
        echo "Checking tables after migration..."
        psql "$DATABASE_URL" -c "\dt" || echo "Failed to list tables"
        echo "Checking database name..."
        psql "$DATABASE_URL" -c "SELECT current_database();" || echo "Failed to get database name"
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}

```

## PostgreSQLのパスワード

PostgreSQLのパスワードは、CloudSQLのWeb画面から自動生成することもできます。ですがURL Safeではないため、うまくいかなかったりします。その場合は、下記でパスワードを生成するとうまくいくかと思います。

[https://mohhh-ok.github.io/url-safe-password-generator](https://mohhh-ok.github.io/url-safe-password-generator)

## CloudSQL Studio

CloudSQL Studioでは、パスワード認証とIAM認証が使えます。パスワード認証だと毎回入力するのが面倒なので、IAMが便利です。IAMを追加した後下記を実行すれば、テーブルが見えるようになります。

```sql
-- 将来のテーブルへの自動権限
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON TABLES TO "xxx@yyy.com";

-- シーケンス権限（AUTO INCREMENTとか使う場合）
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "xxx@yyy.com";
```
