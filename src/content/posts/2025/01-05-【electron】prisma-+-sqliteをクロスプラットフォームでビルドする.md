---
title: "【Electron】Prisma + SQLiteをクロスプラットフォームでビルドする"
pubDate: 2025-01-05
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## ElectronでのPrisma

Prismaは通常のライブラリと違い、独特なディレクトリ構成を持っています。そのためElectronでビルドするには、工夫が必要になります。今回、Mac,Windowsの両方でビルドできるようにできたので、ご紹介させていただきます。

## 前提

*   対応プラットフォーム: Win x64, Mac x64
*   パッケージマネージャー: npm
*   確認したPrismaバージョン: 6.1.0
*   prismaのディレクトリ: <project root>/prisma

## バイナリを指定する

今回Windows, Macに対応するため、以下のようにバイナリを指定します。prisma.schemaです。他のプラットフォームも、試してはいませんが、追加すれば大丈夫だと思います。

```
generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["darwin", "windows"]
}
```

## リソースを指定する

マイグレーションに使用するファイルと、node\_modulesのprisma関連のファイルを、ビルド成果物に含めるように設定します。package.jsonを以下のようにします。

```json
{
  "build": {
    "extraResources": [
      "./prisma/migrations/**/*",
      "./node_modules/.prisma/**/*",
      "./node_modules/@prisma/**/*"
    ]
  }
}
```

## マイグレーション処理を追加する

PrismaでSQLiteを使用する場合、通常は１つのファイルを対象にします。マイグレーションも、通常はCLIで開発時に行います。しかし実際のアプリではユーザーごとに個別のdbを使用することも多いかと思います。そのため、アプリ起動時にマイグレーションする必要があるのですが、CLIだと権限周りが不安です。そのため、コードで処理を書きます。

ユーザーディレクトリにdb.sqliteを作成し、マイグレーションするコードです。

```typescript
import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import { migrate } from './migrate.ts'
import path from 'path'

const userPath = app.getPath('userData')
const dbPath = 'file:' + path.join(userPath, 'db.sqlite')

// ビルド後はリソースディレクトリ、ビルド前はプロジェクトディレクトリを参照
const migrationsPath = app.isPackaged
  ? path.join(process.resourcesPath, 'prisma', 'migrations')
  : path.join(app.getAppPath(), 'prisma', 'migrations')

const prisma = new PrismaClient({ datasources: { db: { url: dbPath } } })
await migrate({ prisma, migrationsPath })
```

使用しているmigrate関数は以下となります。

```typescript
import fs from 'fs-extra';
import path from 'path';
import { PrismaClient } from '@prisma/client/extension';

interface Migration {
    id: string;
    checksum: string;
    finished_at: Date;
    migration_name: string;
    logs: string | null;
    rolled_back_at: Date | null;
    started_at: Date;
    applied_steps_count: bigint;
}

interface Params {
    prisma: PrismaClient;
    migrationsPath: string;
}

export async function migrate(params: Params) {
    const { prisma, migrationsPath } = params;

    console.log('Migrating...');
    await createMigrationsTable(prisma);
    const appliedNames = await getAppliedNames(prisma);
    const pendingMigrations = getMigrations(migrationsPath).filter(
        (m) => !appliedNames.includes(m.name)
    );
    for (const { name, script } of pendingMigrations) {
        await applyMigration(prisma, name, script);
    }
    console.log('Migration done');
}

async function applyMigration(
    prisma: PrismaClient,
    name: string,
    script: string
) {
    await prisma.$transaction(async (tx: PrismaClient) => {
        for (const sql of parseScript(script)) {
            await tx.$executeRawUnsafe(sql);
        }
        await tx.$executeRaw`
      insert into _prisma_migrations(id, migration_name, checksum, started_at, finished_at, applied_steps_count) 
      values (${crypto.randomUUID()}, ${name}, '', ${new Date()}, ${new Date()}, 1)
    `;
        console.log(`Applied: ${name}`);
    });
}

function getMigrations(migrationsPath: string) {
    const dirs = fs
        .readdirSync(migrationsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort((a, b) => a.localeCompare(b));
    return dirs.map((dir) => ({
        name: dir,
        script: fs.readFileSync(
            path.join(migrationsPath, dir, 'migration.sql'),
            'utf-8'
        ),
    }));
}

function parseScript(script: string): string[] {
    return script.split(';').filter((q) => q.trim() !== '');
}

async function createMigrationsTable(prisma: PrismaClient) {
    await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                    TEXT PRIMARY KEY NOT NULL,
      "checksum"              TEXT NOT NULL,
      "finished_at"           DATETIME,
      "migration_name"        TEXT NOT NULL,
      "logs"                  TEXT,
      "rolled_back_at"        DATETIME,
      "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
  )`;
}

async function getAppliedNames(prisma: PrismaClient) {
    const appliedMigrations = (await prisma.$queryRaw`
    select * from _prisma_migrations order by id
  `) as Migration[];
    return appliedMigrations.map((m) => m.migration_name);
}
```

なおmigrate関数は、下記で公開しています。

https://www.npmjs.com/package/@masa-dev/prisma-migrate

## ビルド

armマシンだと自動でarmビルドされたりするため、x64を指定します。

```
"scripts":{
  "build:win": "npm run build && electron-builder --win --x64",
  "build:mac": "npm run build && electron-builder --mac --x64",
}
```
