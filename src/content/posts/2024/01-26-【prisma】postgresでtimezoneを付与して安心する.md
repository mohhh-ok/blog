---
title: "【Prisma】PostgresでTimezoneを付与して安心する"
pubDate: 2024-01-26
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PrismaのDateTimeのデフォルト挙動

PrismaはDateTime型を使用できます。以下のような具合です。

```
expiresAt DateTime  
createdAt DateTime  @default(now())
updatedAt DateTime? @updatedAt
```

これをPostgreSQLにmigrateすると、以下のフィールドになります。

```
timestamp without timezone
```

この状態でPrismaクライアントを使用してデータを挿入すると、タイムゾーンなしのUTCに変換されて保存されます。そのためwhereなどで検索する場合、Timezoneを考慮する必要があります。これはとても面倒で、バグの温床にもなりますし、余計なことに頭を使って疲れてしまいます。

## Timezoneを付与する

そのためTimezoneを付与できれば、夜も安心して眠れるという話です。以下のようにすればTimezoneが付与されます。

```
expiresAt DateTime  @db.Timestamptz(3)
createdAt DateTime  @default(now()) @db.Timestamptz(3)
updatedAt DateTime? @updatedAt @db.Timestamptz(3)
```

ここで(3)となっているのは精度です。指定しない場合は、デフォルトの精度が使用されるようです。このTimestamptzを指定することで、PostgreSQLでは以下のフィールドになります。

Postgresはμsまで対応していますが、JavaScriptのDateはmsまでとなっています。そのため、DB側もmsで統一しておいた方が予期しない問題の回避につながるかと思います。

```
timestamp with timezone
```

これで大丈夫です。なおこれをmigrateすると、dbデータ時刻があらぬ値になり、整合性が失われるため注意が必要です。正確に検証はしていないのですが、どうやらローカル時間に変更した上で、さらにそれをUTCとして扱うような形になっているようです。

## 小話

夜遅くなると薬局が閉まってるので、酒はコンビニで買うしか無いのはお財布が痛いですね。ただコンビニも薬局には無い製品があったりするので、たまにはいいのですが。
