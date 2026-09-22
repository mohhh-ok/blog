---
title: "【Hasura】Apollo+ReactでRoleを変更する"
pubDate: 2024-06-01
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## HasuraでのApollo

ApolloはHasuraで使用できるクライアントライブラリの一つです。Reactのフックなども使用できて、大変便利です。

## ApolloでのRole設定

ApolloをReactで使用する場合、通常はProviderを通します。ルートでクライアントを初期化して使用します。

```typescript
const client = useMemo(() => {
    // ここでApolloClientを作成する
}, [])

return <ApolloProvider client={client}>
        {children}
</ApolloProvider>
```

Roleも通常、ここで定義します。この後でRoleを変更する場合、QueryとSubscriptionとでやり方が異なってきますので、それを書かせていただきます。

## QueryでのRole変更

Queryの場合、Contextを用いてRoleを変更します。具体的には以下のようになります。

```typescript
const { data, refetch } = useQuery(xxx, {
    variables: {},
    context: {role: UserRole.Manager },
});
```

上記のように設定したコンテキストは、Apolloのリンクで処理します。そのリンクは以下のようになります。

```typescript
const authLink = setContext(async (operation, previousContext) => {
    const headers = previousContext.headers;
    const ctx = previousContext;

    // ここでコンテキストからroleを取得できる
    let role = ctx.role || UserRole.Anonymous;

    return {
        headers: {
            ...headers,
            'x-hasura-role': role,
        },
    };
});
```

## SubscriptionでのRole変更

一方Subscriptionだとコンテキストが使用できません。そのため新しくクライアントを作成して対応します。

```typescript
const client = useMemo(() => {
    // ここで、新しくRoleを設定したクライアントを作成する
}, []);

const { data } = useSubscription(xxx, {
    variables: {},
    client,
})
```

以上、QueryとSubscriptionでのRole変更の違いについてでした。これに気づくまでSubscriptionでのRole変更方法がわからず、Queryと併用したりしていました。ですがこの方法なら、Subscriptionだけで楽に書けそうです。

## 余談

少し前まで紅茶花伝のロイヤルミルクティーにハマっていました。ただ飲みやすさを優先しているのか、ちょっとミルクが多くてシャバシャバしてる気がします。今はドトールの直火焙煎カフェオレにハマってます。美味しいです。
