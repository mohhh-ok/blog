---
title: "【Apollo】トークンリフレッシュをもっと簡単に実装する"
pubDate: 2024-01-29
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

以前、Apolloクライアントでトークンリフレッシュを実装する話を書かせていただきました。

http://35.221.87.155/2024/01/26/%e3%80%90apollo%e3%80%91%e3%83%88%e3%83%bc%e3%82%af%e3%83%b3%e3%83%aa%e3%83%95%e3%83%ac%e3%83%83%e3%82%b7%e3%83%a5%e3%82%92%e5%ae%9f%e8%a3%85%e3%81%99%e3%82%8b/

上記はエラー処理で実装していましたが、もっと簡単にできる方法が見つかりましたので、共有させていただきます。

## 簡単に実装するためにJWTをクライアントでデコードする

JWTをクライアントでデコードすれば、実装はかなり簡単になります。なおデコードするだけなので、SECRET値は必要ありません。そのためセキュリティも安全です。

以下はJWTをデコードし、期限を見て切れそうならリフレッシュするチェック関数です。なお足りない関数は、適時状況に合わせて足してください。

```typescript
export async function checkAndRefreshToken() {
    const ADDITIONAL_MSEC = 60 * 1000;
    const exp = getAccessTokenExp();

    if (!exp || Date.now() < exp - ADDITIONAL_MSEC) {
        return;
    }

    await doRefreshToken();
}

function getAccessTokenExp() {
    const token = getAccessToken();
    const exp = decodeToken(token)?.exp * 1000; // トークンの有効期限を取得
    return exp;
}

function decodeToken(token: string | undefined): Record<string, any> | null {
    if (!token) return null;
    const base64Url = token.split('.')[1]; // JWTのペイロード部分を取得
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    const result = JSON.parse(jsonPayload);
    return result;
}
```

## Apolloリクエスト前にリフレッシュチェックをいれる

続いて、上記のチェック関数をApolloに組み込みます。チェック関数はrefreshLinkとして、また通信はhttpLinkとwsLinkを使用しています。httpLinkとwsLinkはsplitLinkで場合分けが行われています。なおwsLinkは再接続のたびにリフレッシュを動作させるために、connectionParamsに関数を渡しています。

```typescript
    const refreshLink = setContext(async (_, { headers }) => {
        await checkAndRefreshToken();
        return {
            headers: { ...headers, ...(await generateHeaders()) },
        };
    });

    const httpLink = new HttpLink({
        uri,
    });

    const wsLink = new WebSocketLink({
        uri: wsUri,
        options: {
            reconnect: true,
            connectionParams: async () => {
                await checkAndRefreshToken();
                return { headers: await generateHeaders() };
            },
        },
    });

    const splitLink = split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
            );
        },
        wsLink,
        httpLink
    );

    return from([refreshLink, splitLink]);
```

これで、だいぶ簡単にApolloでトークンリフレッシュが実装できました。

## 小話

このまえ久しぶりにリカーマウンテンに行きました。お酒の種類が多くていいですね。ちょうど安売りしていた何かのフルーツの酎ハイが美味しかったです。
