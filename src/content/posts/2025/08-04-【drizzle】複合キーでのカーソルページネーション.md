---
title: "【Drizzle】複合キーでのカーソルページネーション"
pubDate: 2025-08-04
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

分かれば簡単なのですが、若干理解に時間のかかるかもしれない、複合キーでのカーソルページネーションについて考えます。

## ページネーション

ページネーションは、よくある下記のようなものです。

```
前へ 1 2 3 4 次へ
```

検索結果を小出しにする時などに使用します。データベースでは下記のようなパラメータを用います。

```
- limit: ページごとの数
- offset: どれだけ飛ばすか
```

これが一般的なページネーションです。

実装は比較的簡単ですが、デメリットもあります。レコード数が膨大になると、計算に時間がかかってしまいます。なぜならoffsetが常に先頭から計算されるため、後になるほど負荷が大きくなります。また通常は総数も同時に用いるため、そこの計算コストもかかってきます。

## カーソルページネーション

カーソルページネーションは、上記のページネーションの問題点を解決します。一長一短ですが、レコード数が膨大になることが予想される場合は、こちらのカーソルページネーションが用いられます。

```
前へ 次へ
```

通常のページネーションと違い、ページ数がありません。これは通常、総数を用いないためです。その代わりに計算コストを抑えることができます。

### 単一カーソルの例

次の場合を考えます。

```
person table
- id: auto increment
- name: string
```

オートインクリメントのidと、文字列のnameをもったレコードです。これをカーソルページネーション実装するには、下記のようになります。

*   idでソート
*   特定idを基準にwhereを作る

たとえば id = 3 をカーソルとすると、下記のようになります。

```
SELECT * from person where id > 3 ORDER BY id
```

これにより、idが3より大きいレコードが抽出されます。idでソートされているため、順番も確保されます。なおこれは、idがuniqueであることが前提です。一方でuniqueではないフィールドでソートするには、どうすればいいでしょう。

### 複合カーソルの例

以下のようなテーブルを考えます。

```
person table 
- id: auto increment
- name: string
- age: number
```

ageでソートするとどうなるでしょう。試しに

```
SELECT * from person ORDER BY age
```

とします。しかしageが同じであるレコードが複数存在することが予測されます。そうすると、同じage=18のレコードの中で、順番が確保されません。このままではカーソルページネーションを行うことができません。

そのため、order部分を以下のようにします。

```
ORDER BY age, id
```

idがuniqueであるため、これで順番が保たれるようになります。

この場合、カーソルページネーションを用いるには、以下のようにします。

*   age, idで複合ソート
*   ageでwhereを作る
*   age + idでもwhereを作る

考え方としては、

```
ageが18より大きければ、同じ年齢帯はヒットしないため問題ない
同じ年齢帯の場合は、idで処理する
```

たとえばid=3, age=18の人物の次のページネーションを行うには、whereは次のようになります。

```
WHERE (age > 18) OR (age = 18 AND id > 3)
```

最終的には下記のようになります。

```
SELECT * FROM person WHERE (age > 18) OR (age = 18 AND id > 3) ORDER BY age, id
```

## Drizzleでの複合キーのカーソルページネーション

Drizzleでは以下のようになります。なおlimit+1で取得して、実際に次のページがあるかどうかの判定に用いるパターンもありますが、今回はシンプルにしました。

```typescript
type Cursor = {
  id: string;
  age: number;
}

export async function getUsers(params: { limit: number, cursor?: Cursor }) {
  const { limit, cursor } = params;
  const users = await db().query.usersTable.findMany({
    where: cursor
      ? or(
        lt(usersTable.age, cursor.age),
        and(
          eq(usersTable.age, cursor.age),
          lt(usersTable.id, cursor.id)))
      : undefined,
    orderBy: [desc(usersTable.age), desc(usersTable.id)],
    limit,
  })

  // 次のページがあるかどうか
  const hasMore = users.length === limit;

  // 次のページのカーソルを取得
  const lastUser = users[users.length - 1]
  const nextCursor: Cursor | undefined = hasMore
    ? {
      id: lastUser.id,
      age: lastUser.age
    }
    : undefined;
    
  return { ok: true, data: { users, nextCursor } }
}
```

### 面倒なので共通化した

毎回ここまでコードを書くとメンテナンス性が落ちるため、共通化しました。

```typescript
import { and, asc, desc, eq, gt, lt, or } from "drizzle-orm";

export function createCursorPagination<T>(params: { order: 'asc' | 'desc', table: any, cursor: any | undefined, field: keyof T, uniqueField: keyof T, limit: number }) {
  const { order, table, cursor, field, uniqueField, limit } = params;
  const ltOrGt = { 'asc': gt, 'desc': lt }[order];
  const ascOrDesc = { 'asc': asc, 'desc': desc }[order]
  const orderBy = [ascOrDesc(table[field]), ascOrDesc(table[uniqueField])]
  const where = cursor
    ? or(
      and(
        ltOrGt(table[field], cursor[field]),
        ne(table[uniqueField], cursor[uniqueField])), // 精度のズレによる問題を解消（*後述)
      and(
        eq(table[field], cursor[field]),
        ltOrGt(table[uniqueField], cursor[uniqueField])
      ))
    : undefined;

  const getNextCursor = (items: T[]): T | undefined => {
    if (items.length < limit) return;
    const lastItem = items[items.length - 1]
    if (!lastItem) return;
    return { [field]: lastItem[field], [uniqueField]: lastItem[uniqueField] } as T
  }

  return { where, orderBy, limit, getNextCursor }
}
```

これを使えば、以下のようにスッキリ書けるようになります。

```typescript
type Cursor = Pick<User, 'id'|'age'>

export async function getUsers(params: { limit: number, cursor?: Cursor }) {
  const { limit, cursor } = params;
  const { getNextCursor, ...rest } = createCursorPagination<Cursor>({
    order: 'asc',
    table: usersTable,
    cursor,
    field: 'age',
    uniqueField: 'id',
    limit
  })

  const users = await db().query.usersTable.findMany({
    ...rest
  })

  const nextCursor = getNextCursor(users);
    
  return { ok: true, data: { users, nextCursor } }
}
```

## 精度に注意

timestampなどのフィールドは精度が合っていないと、意図しない抽出結果になったりします。たとえばJavaScriptのDateはmsまでですが、Postgresはμsまで対応している関係から、cursorが機能しなくなったりします。

その場合はDB側の精度をmsまで落とすか、あるいはidでの不一致を条件に加える必要があります。
