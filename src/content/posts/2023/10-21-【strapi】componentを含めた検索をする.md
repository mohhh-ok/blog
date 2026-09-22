---
title: "【Strapi】Componentを含めた検索をする"
pubDate: 2023-10-21
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Componentを含めた検索方法

以下のようなモデルの場合です。カテゴリーモデルのnameフィールドに、リピータブルなComponentを入れています。このComponentは翻訳用で、localeとtextの２つのフィールドを持っています。

```
Category
|- name
    |- Translation Component (Repeatable)
        |- locale
        |- text 
```

ここから指定の翻訳テキストのレコードを取得するには、以下のようにします。

```typescript
res = await strapi.db.query("api::category.category").findOne({
    where: { name: {  text: { $contains: 'あいうえお' }  } },
    populate: { "name": true },
});

```

レスポンスは以下のようになります。

```typescript
{
   id: 2,
   createdAt: '2023-10-21T02:48:19.907Z',
   updatedAt: '2023-10-21T02:48:19.907Z',
   name: [
     { id: 32025, locale: 'ja', text: 'あいうえお' },
     { id: 32026, locale: 'en', text: 'abcdefg' }
   ]
 }
```

ではでは。
