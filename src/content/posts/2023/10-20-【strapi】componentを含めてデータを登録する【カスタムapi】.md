---
title: "【Strapi】Componentを含めてデータを登録する【カスタムAPI】"
pubDate: 2023-10-20
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## カスタムAPIでデータを登録する

ファイル構成などは省かせていただきますが、controllers/xxxのファイルでの話です。

データベースを操作するにはEntity Service APIとQuery Engine APIの２つがあります。このうち公式サイトの説明ではEntity Service APIの方が簡単だということでこちらを使いたかったのですが、create関数の説明が見当たらない。

なるほど、createするにはQuery Engine APIしかないのねと思いそちらで頑張ってみたのですが、どうしてもComponentが絡むとうまくいかない。そもそもComponentが入っているテーブルがわからない。APIディレクトリにもそれらしきものは見当たらない。

そこでGoogle先生にお伺いすると、以下で同じような状況の方がおられました。

https://forum.strapi.io/t/populate-components-while-creating-updating-an-entry-with-query-engine-api/29577

## Componentを含めて登録するには

結局、Entity Service APIにcreate関数が存在しましたので、以下のようにすれば簡単にComponentも含めて登録できます。

```typescript
await strapi.entityService.create("api::xxx.xxx", { data: item });
```

うーむ、どこにEntity Service APIのcreate関数の説明があるのだろうか。。。

ではでは。
