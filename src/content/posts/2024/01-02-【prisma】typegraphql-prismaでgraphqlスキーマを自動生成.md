---
title: "【Prisma】typegraphql-prismaでGraphQLスキーマを自動生成"
pubDate: 2024-01-02
categories: ["Prisma"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

これまでRestAPIでやっていたのですが、比較的大きめのプロジェクトではやはりエンドポイントをちまちま作るのが面倒になり、GraphQLを使用することにしました。できるだけ楽したい、今後細かな変更も楽して反映させたい、そんな熱意の話です。

## typegraphql-prisma

typegraphql-prismaは、prismaスキーマからTypeGraphQLのmodelやresolverを自動生成してくれます。

https://prisma.typegraphql.com/

これでほぼ自動でGraphQLを出力できるのですが、ただちょっと色々問題もありまして、以下その解決方法です。

## バージョン問題

graphqlライブラリは、2024/01/02現在バージョン16まで上がっていますが、ここで破壊的変更が行われたようです。そのためtype-graphqlはベータ版を使う必要があります。現在、type-graphqlのバージョンは2.0.0-beta.3で動作確認できました。

ちょっと必要不必要が整理できていないのですが、package.jsonは以下のような感じで作成しています。

```javascript
  "dependencies":{
    "graphql": "^16.7.1",
    "graphql-fields": "^2.0.3",
    "graphql-scalars": "^1.22.4",
    "type-graphql": "2.0.0-beta.3",
    "typegraphql-nestjs": "^0.6.0"
  },
  "devDependencies": {
    "prisma": "^5.7.1",
    "typegraphql-prisma": "^0.27.1"
  }
```

## 生成コード問題

typegraphql-prismaで自動生成されるコードは、以下の部分でエラーが出ます。おそらくほかに回避方法があるかと思いますが、今のところ以下のように修正して対応しています。

```typescript
// helpers.ts

// import graphqlFields from "graphql-fields";
import * as graphqlFields from "graphql-fields";
```

## リレーションが解決しない

### 2024/01/03追記

これに関しては、どうやらresolverを限定していたことが原因でした。resolversを渡すときに、generatedされたindex.tsにあるresolversを使用することで、リレーションが反映されるようになりました。一応、以前の記事文章は以下に残しておきます。

\-- 解決以前の文章 --

これはまだ原因不明なのですが、prismaスキーマで設定したリレーションが、typegraphql-prismaで自動生成されるコードに反映されません。そのため別でcustomディレクトリを作成してコピーし、手動で変更反映することにしました。

## 結論

楽したいがために色々調べるのですが、どうも解決できそうにないので、ひとまず次善策で進めていこうと思います。

## 小話

年明けそうそうに大きな地震で、私のところはゆっくりな揺れがしばらく続きました。いつもはガタガタガタ！と一瞬だけ揺れるのですが。たまたまなのか、地盤が変わったのでしょうか。
