---
title: "【Drizzle】画期的？Viewに__typeフィールドを埋め込んでセキュリティを高める"
pubDate: 2025-08-23
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## DrizzleのView

DirzzleではスキーマレベルでViewを作成することができます。

```typescript
export const usersTable = pgTable('users', {
  id: text().unique(),
  handle: text().unique().$defaultFn(() => 'user_' + createId()),
  email: text().unique(),
  phone: text().unique(),
  passwordHash: text(),
});

export const usersPublicView = pgView('users_public')
  .as(qb => qb
    .select({
      id: usersTable.id,
      handle: usersTable.handle,
    })
    .from(usersTable));
```

この例では、usersTableからidとhandleのみのViewを作成しています。便利ですね。

## \_\_typeを入れてみる

これに\_\_typeを入れてみます。

```typescript
__type: sql<'user_public'>`'user_public'`.as('__type'),
```

これで、Viewから生成される型に\_\_typeフィールドが固定値'user\_public'が追加されるようになります。

```typescript
type UserPublic = typeof usersPublicView.$inferSelect

// type UserPublic = {
//   __type: "user_public";
//   id: string;
//   handle: string | null;
// }
```

\_\_typeの設定が複雑ですので、関数にします。

```typescript
export function mkType<T extends string>(type: T) {
  return { __type: sql<T>`${sql.raw(`'${type}'`)}`.as('__type') }
}
```

これを使うと、Viewは以下のようになります。

```typescript
export const usersPublicView = pgView('users_public')
  .as(qb => qb
    .select({
      ...mkType('user_public'),
      id: usersTable.id,
      handle: usersTable.handle,
    })
    .from(usersTable));
```

## 試してみる

試してみました。

```typescript

type User = typeof usersTable.$inferSelect
type UserPublic = typeof usersPublicView.$inferSelect

const showUser = (user: User) => {
  console.log(user);
}

const showUserPublic = (user: UserPublic) => {
  console.log(user);
}

const user: User = {} as User;
const userPublic: UserPublic = {} as UserPublic;

showUser(user);
showUser(userPublic); // 型エラー
showUserPublic(user); // 型エラー
showUserPublic(userPublic);
```

うまい具合に、型レベルで漏洩を検知することができるようになりました。意図しない挿入が防止できています。これは使えそうですね。

## おまけ: Remedaを入れてみる

RemedaでViewをさらに型安全に書けます。

```typescript
import * as R from 'remeda';

export const usersPublicView = pgView('users_public')
  .as(qb => qb
    .select({
      ...mkType('user_public'),
      ...R.pick(usersTable, ['id', 'handle']),
    })
    .from(usersTable));
```

## 注意: バージョンによっては使えない

Drizzleのバージョンによっては、Viewの生成でエラーになります。2025年8月23日 v0.44.3時点ではまだ解決していないようです。

[https://github.com/drizzle-team/drizzle-orm/issues/4731](https://github.com/drizzle-team/drizzle-orm/issues/4731)

代替案として、今回はViewを作成せずqueryに埋め込みました。その詳細は下記に書いています。将来的にFixされてViewが使えるようになった時に、どちらを使用するかは用途やお好みでいいかと。

https://www.masaakiota.net/2025/08/24/%e3%80%90drizzle%e3%80%91query%e3%81%ab\_\_type%e3%82%92%e5%9f%8b%e3%82%81%e8%be%bc%e3%82%93%e3%81%a7%e5%9e%8b%e5%bc%b7%e5%8a%9b%e3%81%ab%e3%81%99%e3%82%8b/
