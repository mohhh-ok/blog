---
title: "【Strapi】TypeScriptでDB操作時のContent Type入力を楽にする"
pubDate: 2023-10-22
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Strapi DB操作でのContent Type

StrapiではDB操作に以下のような文字列を渡す必要があります。

```typescript
await strapi.entityService.create(
    "api::category.category", // <= これ
    data
)
```

この文字列をいちいち管理画面からContent Typeの名前を確認して、いざ入力してみたはいいものの合わないなどなかなか

そこでStrapiは便利な機能を用意してくれています。

## Typeファイル生成コマンド

以下のコマンドをプロジェクトのルートで打てば、自動で型定義ファイルが生成されます。これにより自動保管が有効になり、入力が楽になります。うーん、便利。

```
npm run strapi ts:generate-types
```

なおテーブルを更新するたびに実行しなければいけないので、shファイルなどを生成しておくと覚えておかなくて良いので良いかもしれません。

ではでは。
