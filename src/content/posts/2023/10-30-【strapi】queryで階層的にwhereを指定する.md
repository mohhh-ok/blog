---
title: "【Strapi】queryで階層的にwhereを指定する"
pubDate: 2023-10-30
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Strapiのquery

Strapiはquery APIが用意されています。

```typescript
const res = await strapi.query("api:book.book").find({
    where: { id: 1}
})
```

上記では、id=1のbookを取得しています。

さて、このbookは以下のフィールドを持つとします。

```
id: number
author: relation of author
```

authorは以下とします。

```
id: number
name: string
```

この場合、authorのnameが"山田"であるレコードを取得するには、どうすればいいでしょうか？

## 階層的な指定

strapiでは階層構造を指定してqueryでの抽出が可能です。

具体的には、先述の要望を実現するには、以下のようにします。

```typescript
const res = await strapi.query("api::book.book").find({
    where: {
        author: {
            name: "山田"
        }
    }
})
```

このように、オブジェクトを入れ子にすることで階層構造での指定が可能です。

whereについては以下に記載されています。

https://docs.strapi.io/dev-docs/api/query-engine/filtering/
