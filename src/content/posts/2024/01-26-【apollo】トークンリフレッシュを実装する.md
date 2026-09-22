---
title: "【Apollo】トークンリフレッシュを実装する"
pubDate: 2024-01-26
categories: ["React"]
tags: []
---

2024/01/29追記：もっと簡単に実装できる方法を以下で紹介しています。

http://35.221.87.155/2024/01/29/%e3%80%90apollo%e3%80%91%e3%83%88%e3%83%bc%e3%82%af%e3%83%b3%e3%83%aa%e3%83%95%e3%83%ac%e3%83%83%e3%82%b7%e3%83%a5%e3%82%92%e7%b0%a1%e5%8d%98%e3%81%ab%e5%ae%9f%e8%a3%85%e3%81%99%e3%82%8b/

こんにちは、フリーランスエンジニアのmohです。

Hasuraを使っている関係でApollo Clientを使用しているのですが、日本語解説があまり見つけられないこともありなかなか苦戦しました。ChatGPTがあってよかったです。

## Apollo ClientのLink

Apollo ClientにはLinkというものがあります。

```typescript
new ApolloClient({
    ...
    from([errorLink, authLink, httpLink]),
});
```

このリンクに色々渡すことで、エラーやコンテキストなどのハンドリングを行えます。今回はerrorLink, authLink, httpLinkを作成して入れています。

実際に確認したわけでは無いのですが、ChatGPT先生によると以下のようです。

```
ChatGPT先生 「リンクは左から順に実行され、リクエストが実行された後また左へ帰っていく」
```

だそうです。これを知っているのと知っていないのとで、だいぶ理解度が変わってきます。

## errorLink

エラーハンドリングはonErrorを用います。

```typescript
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (graphQLErrors?.some((err) => err.extensions.code === 'invalid-jwt')) {
        accessTokenCache = '';
        return forward(operation);
    }
});
```

エラーにはgraphQlErrorsとnetworkErrorの２つがあるのですが、jwt認証エラーはgraphQlErrorsに入っています。Hasuraの場合、networkerrorでは補足できません。

### forward

forwardにoperationを渡すことで、リトライできるようになります。ただ注意すべき点として、forwardでリトライする場合、linkは右へ戻ります。例えば

```typescript
from([authLink, errorLink, httpLink])
```

となっていた場合、authLink => errorLink => httpLink => errorLink => httpLinkという順になります。そのためauthLinkを実行するために、以下のようにする必要があります。

```typescript
from([errorLink, authLink, httpLink])
```

### 非同期処理は使えない

onErrorでは非同期処理は使えません。Promiseを返すと文法エラーとなります。ですので、非同期処理でトークンを更新する場合、他のリンクを使うことになります。

## authLink

先ほどのエラーLinkで、認証に失敗した場合に tokenキャッシュをクリアしていました。これはonErrorの中で非同期処理を使えないためです。非同期処理を使用するために、setContextを使います。

```typescript
const authLink = setContext(async (_, { headers }) => {
    const retryCount = headers?.retryCount || 0;
    if(retryCount > 3) {
        throw new Error('retryCount over 3');
    }
    const token = await accessToken();
    return {
        headers: {
            ...headers,
            authorization: 'Bearer ' + token,
            retryCount: retryCount + 1,
        },
    };
});
```

キャッシュがなければ更新するといった具合に、以下のように実装します。

```typescript
async function accessToken() {
    if (accessTokenCache) {
        return accessTokenCache;
    }
    ...
}
```

## httpLink

最後にhttpLinkです。

```typescript
const httpLink = new HttpLink({
    uri,
    headers: {
        Authorization: 'Bearer ' + await accessToken(),
    },
});
```

このような感じで、トークンのリフレッシュが実装できました。ふぅ。

## 小話

松屋が生パスタのお店を出すそうですね。ただお値段は結構するそうです。一度食べてみたい気はするのですが、私の近所には来ないだろうか。
