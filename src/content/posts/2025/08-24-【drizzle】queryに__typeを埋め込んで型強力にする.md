---
title: "【Drizzle】queryに__typeを埋め込んで型強力にする"
pubDate: 2025-08-24
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです

以前、DrizzleのViewで\_\_typeを埋め込んで、型を強化する話を書きました。

https://www.masaakiota.net/2025/08/23/%e3%80%90drizzle%e3%80%91%e7%94%bb%e6%9c%9f%e7%9a%84%ef%bc%9fview%e3%81%ab\_\_type%e3%83%95%e3%82%a3%e3%83%bc%e3%83%ab%e3%83%89%e3%82%92%e5%9f%8b%e3%82%81%e8%be%bc%e3%82%93%e3%81%a7%e3%82%bb%e3%82%ad/

今回は、Viewを使わずqueryでやってしまおうというお話です。

## 実行環境

*   PostgreSQL
*   drizzle-orm: 0.44.4

## tableを用意する

下記のテーブルを用います。

```typescript
export const usersTable = pgTable('users', {
  id: text().notNull(),
  handle: text().unique(),
  email: text(),
}
```

## ユーティリティ関数を用意する

下記のようなユーティリティ関数を作ります。

```typescript
export function mkType<T extends string>(type: T) {
  return { __type: sql<T>`${sql.raw(`'${type}'`)}`.as('__type') }
}
```

これは、フィールドに\_\_typeとして固定値を入れるためのものです。詳細は前回の記事を参照ください。

## queryを作る

queryを作ります。

```typescript
import { SQL } from "drizzle-orm";

// queryで受け取る引数
export type CustomQueryParams = {
  where?: SQL<unknown>
  orderBy?: SQL<unknown>
  limit?: number
  offset?: number
}

// 自身参照用
export const userAsSelfQuery = (params?: CustomQueryParams) => db()
  .query
  .usersTable
  .findOne({
    extras: { ...mkType('user_self') },
    with: {
      posts: true,
    },
    ...params,
  });

// 公開用
export const usersAsPublicQuery = (params?: CustomQueryParams) => db()
  .query
  .usersTable
  .findMany({
    extras: { ...mkType('users_public') },
    columns: { email: false, }, // 機密情報を除く
    with: {
      posts: true,
    },
    ...params,
  });


```

型を作ります。type指定しているため、クライアントから読み込んでも安全です。

```typescript
// type指定でimportすることで、サーバークライアント間のエラーを防ぐ
import type {userAsSelfQuery, usersAsPublicQuery} from 'queries';

export type UserAsSelf = Awaited<ReturnType<typeof userAsSelfQuery>>
export type UserAsPublic = Awaited<ReturnType<typeof usersAsPublicQuery>>[number]
```

## 使ってみる

下記のようにして使います。

```typescript
function showMe(me: UserAsSelf) {
  console.log(me);
}

function showAsPublic(user: UserAsPublic){
  console.log(user);
}

async function test() {
  const me = await userAsSelfQuery();
  const usersPublic = await usersAsPublic();

  showMe(me);
  showMe(usersPublic[0]); // 型エラーになる

  showPublic(me); // 型エラーになる
  showPublic(usersPublic[0]);
}
```

\_\_typeに固定値が入っているため、予期しないところでの使用時に型エラーが出るようになります。

## 型生成ユーティリティを作る

これまではReturnTypeを使ってきましたが、使い勝手が悪いためユーティリティを作りました。説明が大変ですので、サンプルコードを載せます。

```typescript
import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations, SQL } from 'drizzle-orm';
import { and, eq, isNotNull, relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Pool } from 'pg';


//=== スキーマ ===//

const usersTable = pgTable('users', {
  id: text().primaryKey(),
  name: text(),
  email: text(),
  passwordHash: text(),
  deletedAt: timestamp(),
});

const postsTable = pgTable('posts', {
  id: text().primaryKey(),
  userId: text().references(() => usersTable.id),
  title: text(),
  content: text(),
});

const userRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
}));

const schema = { usersTable, postsTable, userRelations }


//=== db ===//

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle({
  client: pool,
  schema,
});


//=== 型とユーティリティ ===//

type TSchema = ExtractTablesWithRelations<typeof schema>

type BaseQueryConfig<TableName extends keyof TSchema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>

export type SelectionConfig<TableName extends keyof TSchema> =
  Omit<BaseQueryConfig<TableName>, 'extras'> & { extras?: (fields: unknown) => unknown, where?: SQL<unknown> }

export type InferSelection<
  TableName extends keyof TSchema,
  QBConfig extends SelectionConfig<TableName> = {}
> = BuildQueryResult<TSchema, TSchema[TableName], QBConfig>

// extra type生成
export function mkType<T extends string>(type: T) {
  return { __type: sql<T>`${sql.raw(`'${type}'`)}`.as('__type') }
}


//=== selection ===//

const postSelection = {
  extras: () => ({ ...mkType('publicPost') }), // 関数にすることで入れ子時に型エラーが出なくなる
  columns: {
    id: true,
    title: true,
  },
} satisfies SelectionConfig<'postsTable'>

const userSelection = {
  extras: () => ({ ...mkType('publicUser') }),
  columns: {
    passwordHash: false,
  },
  with: {
    posts: postSelection,
  },
  where: isNotNull(usersTable.deletedAt),
} satisfies SelectionConfig<'usersTable'>


//=== 型生成 ===//

export type PublicPost = InferSelection<'postsTable', typeof postSelection>
// type PublicPost = {
//   id: string;
//   title: string | null;
//   __type: "publicPost";
// }

export type PublicUser = InferSelection<'usersTable', typeof userSelection>
// type PublicUser = {
//   id: string;
//   name: string | null;
//   email: string | null;
//   __type: "publicUser";
//   posts: {
//       id: string;
//       title: string | null;
//       __type: "publicPost";
//   }[];
// }


//=== クエリ ===//

db.query.usersTable.findMany({
  ...userSelection,
  where: and(
    userSelection.where,
    eq(usersTable.id, '1')),
  limit: 10,
}).then(res => console.log(res));
// (parameter) res: {
//   id: string;
//   name: string | null;
//   email: string | null;
//   deletedAt: Date | null;
//   __type: "publicUser";
//   posts: {
//       id: string;
//       title: string | null;
//       __type: "publicPost";
//   }[];
// }[]


```
