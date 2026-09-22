---
title: "【Apollo】useMutation後、自動でデータ更新する"
pubDate: 2024-11-28
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Apollo client

Apollo clientはReactでも便利に使えるclientです。全体でキャッシュを持っており、一部の更新が全体に反映されたりと、データ帯域の節約にもつながります。

## useMutation後、データ更新もセットで行う

以下のように行います。UpdateUserDocument, およびGetUserDocumentは、graphql-codegenで生成しています。

```jsx
const [updateUser] = useMutation(UpdateUserDocument, {
    context,
    refetchQueries: [{
        query: GetUserDocument,
        variables: { id: user.id },
        context
    }]
});
```

onUpdatedなどコンポーネントに渡す引数が減るのは、ありがたいですね。

## 本当は、キャッシュをいじる方が帯域節約

refetchQueriesを指定すると、ネットワークを使用してデータ更新が行われます。

一方キャッシュを直接指定する方法もあります。ただキャッシュをどうこうする場合、かなり複雑でコードも見にくくなります。精神衛生上は、refetchQuerirsを使うのが良さそうです。
