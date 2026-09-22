---
title: "【Prisma】v6.6.0でschema分割方法が変わった"
pubDate: 2025-04-12
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Prismaのスキーマ分割

Prismaのスキーマは分割できますが、現在プレビュー版です。破壊的な変更が起こることが今後も想定されます。今回は、具体的なディレクトリ指定が必要になったようです。

公式の解説は以下です。

[https://www.prisma.io/docs/orm/prisma-schema/overview/location](https://www.prisma.io/docs/orm/prisma-schema/overview/location)

## 手順

schema.prismaにpreviewFeaturesを追加します。ここは以前と変わりません。

```
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}
```

package.jsonで、schemaディレクトリを指定します。ここはMagickではなくなり、自動検出が行われません。

```
// package.json
{
  "prisma": {
    "schema": "./schema"
  }
}
```

package.jsonに指定する以外にも方法があります。それらに関しては、公式サイトを参照ください。

migrationsディレクトリと、メインのschemaファイルは同ディレクトリにある必要があります。

```
# `migrations` and `schema.prisma` are on the same level
.
├── migrations
├── models
│   ├── posts.prisma
│   └── users.prisma
└── schema.prisma
```

以上、変更点でした。
