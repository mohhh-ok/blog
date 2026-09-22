---
title: "【Prisma】Prismaで気をつけること"
pubDate: 2024-06-24
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Prisma

Prismaは、TypeScriptで使えるORMです。スキーマ設計からマイグレーション、また簡単な関数でデータアクセスや更新が行えます。

https://www.prisma.io

## 気をつけること

今回は、そんなPrismaを使用していて気になった点を書いてみます。

### v5.15.1時点で、JOINは内部で行われない

#### 内部的JOINはv5.8.0でPreview版

先に申し上げると、v5.8.0からはPreview版で、PostgreSQLで内部的にJOINを用いたクエリを投げることはできます。5.10.0からはMySQLにも対応している様です。

https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries

#### 基本的には内部でJOINは使われない

上記はあくまでPreview版なので、本番では使わない方がいいかもしれません。このPreview版機能を使用せずに、JOINのような機能を使うと以下の様になります。

```
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
})
```

これを実行すると、まるでJOINしたかのような結果が返ってきます。しかし実際にはJOINは使われておらず、複数のSQL文が発行されます。そのためパフォーマンスは落ちることになります。速度重視の部分ではRawクエリで対応するとこになります。

### Transactionは必要最低限にする

Prismaでは、以下の様にTransaction内で実行することができます。

```
await prisma.$transaction(async (tx) => {
    // Code running in a transaction...
})
```

整合性が担保されるため非常に良いのですが、中で時間がかかると複数アクセスですぐにエラーが発生します。トランザクションを持てる数が制限されているためです。この数は設定で変えれるのですが、トランザクションは本当に必要最低限にした方が良さそうです。

## 余談

ずいぶん暑くなってきました。エアコンは冷えすぎるので使いたくないのですが、そうも言ってられない時が近づいてきています。。。
