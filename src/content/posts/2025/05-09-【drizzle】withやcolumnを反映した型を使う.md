---
title: "【Drizzle】withやcolumnを反映した型を使う"
pubDate: 2025-05-09
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Drizzleでの型

DrizzleはTypeScriptに対応しています。ただ比較的新しいライブラリのためか、型が若干弱いです。Prismaなら簡単に作れる型でも、Drizzleだと苦労すると言った場面も。

## withやcolumnを反映させる

withやcolumnを反映させた型を使うには、独自に設定する必要があります。下記のようなユーティリティー型を作り、実現します。

```typescript
import type * as schema from './schema'
import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm'
import { Exact } from 'type-fest'

type TSchema = ExtractTablesWithRelations<typeof schema>

type QueryConfig<TableName extends keyof TSchema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>

export type InferQueryModel<
  TableName extends keyof TSchema,
  QBConfig extends Exact<QueryConfig<TableName>, QBConfig> = {}
> = BuildQueryResult<TSchema, TSchema[TableName], QBConfig>
```

使用する際は、InferQueryModelを使います。

```typescript
type UserNameWithPostTitles = InferQueryModel<'users', {
  columns: {
    id: true,
    name: true
  },
  with: {
    posts: {
      columns: {
        id: true,
        title: true
      }
    }
  }
}>;
```

下記を参考にさせていただきました。というより、URLをChatGPTに丸投げでした。はい。かしこい人には頭が上がりません。

[https://github.com/drizzle-team/drizzle-orm/issues/695#issuecomment-1881454650](https://github.com/drizzle-team/drizzle-orm/issues/695#issuecomment-1881454650)

## Selectの場合

上記はqueryですが、selectの場合は別のものを使用します。ChatGPT5に作ってもらいました。

```typescript
type RowOf<Q> =
  Q extends { execute: (...args: any) => Promise<infer R> }
  ? R extends (infer U)[] ? U : never
  : never
```

以下のようにして使います。

```typescript
const userBuilder = () => db()
  .select({
    id: usersTable.id,
    session: { id: sessionsTable.id, expiresAt: sessionsTable.expiresAt }
  })
  .from(usersTable)
  .leftJoin(sessionsTable, eq(sessionsTable.userId, usersTable.id));

type User = RowOf<ReturnType<typeof userBuilder>>;


const users = await userBuilder()
  .where(gt(usersTable.id, '1'))
  .limit(10);
```
