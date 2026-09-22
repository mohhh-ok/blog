---
title: "【Strapi】APIでUnpublishedのデータを取得する"
pubDate: 2023-10-31
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## StrapiのAPIでUnpublishedのデータを取得

Strapiではデフォルトで、APIではPublishedのデータしか返しません。またPublishedといったboolean値があるわけでもありません。

ただし、UnpublishedのデータはpublishedAtがnullになります。それを利用します。

以下のようなクエリを投げます。

```typescript
{ where: { $not: { publishedAt: null } } }
```

これでOKです。

ではでは。
