---
title: "【Prisma】Migrationスクリプトを書いてみた"
pubDate: 2025-01-05
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PrismaのMigrate

Prismaでは、通常CLIでMigrationを行います。しかしアプリ実行時に行いたくなる時もあります。今回、アプリ内で実行できるスクリプトを書いてみました。

## Migrateするコード

以下のようにして使用できるコードを作成しました。

```typescript
const migrationsPath = 'xxx'; // migrationsディレクトリのパス
const prisma = new PrismaClient()
await migrate({ prisma, migrationsPath })
```

なお、prisma.schemaで指定したdbは、prisma migrate devで最新になるため、そもそもコードで追う必要がありません。そのため、prisma.schemaで指定したのとは違うdbを指定することを前提にしています。ユーザー個別のdbといった場合ですね。

以下がコードです。Prisma6.1.0で動作確認しています。

なお厳密な実装ではないので、あしからずご了承くださいますと幸いです。

```typescript
import { PrismaClient } from '@prisma/client'
import fs from 'fs-extra'
import path from 'path'

interface Migration {
  id: string
  checksum: string
  finished_at: Date
  migration_name: string
  logs: string | null
  rolled_back_at: Date | null
  started_at: Date
  applied_steps_count: bigint
}

type Params = {
  prisma: PrismaClient
  migrationsPath: string
}

export async function migrate(params: Params) {
  const { prisma, migrationsPath } = params

  console.log('Migrating...')
  await createMigrationsTable(prisma)
  const appliedNames = await getAppliedNames(prisma)
  const pendingMigrations = getMigrations(migrationsPath).filter(
    (m) => !appliedNames.includes(m.name)
  )
  for (const { name, script } of pendingMigrations) {
    await applyMigration(prisma, name, script)
  }
  console.log('Migration done')
}

async function applyMigration(prisma: PrismaClient, name: string, script: string) {
  await prisma.$transaction(async (tx) => {
    for (const sql of parseScript(script)) {
      await tx.$executeRawUnsafe(sql)
    }
    await tx.$executeRaw`
      insert into _prisma_migrations(id, migration_name, checksum, started_at, finished_at, applied_steps_count) 
      values (${crypto.randomUUID()}, ${name}, '', ${new Date()}, ${new Date()}, 1)
    `
    console.log(`Applied: ${name}`)
  })
}

function getMigrations(migrationsPath: string) {
  const dirs = fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => a.localeCompare(b))
  return dirs.map((dir) => ({
    name: dir,
    script: fs.readFileSync(path.join(migrationsPath, dir, 'migration.sql'), 'utf-8')
  }))
}

function parseScript(script: string): string[] {
  return script.split(';').filter((q) => q.trim() !== '')
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
  )`
}

async function getAppliedNames(prisma: PrismaClient) {
  const appliedMigrations = (await prisma.$queryRaw`
    select * from _prisma_migrations order by id
  `) as Migration[]
  return appliedMigrations.map((m) => m.migration_name)
}
```
