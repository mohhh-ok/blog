---
title: "【eBay】OAuth2利用のための、必要な値の取得"
pubDate: 2025-03-15
categories: ["未分類"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## eBayのOAuth

eBayのOAuthでは、下記の情報が必要です。

*   Client ID
*   Client Secret
*   RuName

またRuNameの取得には、アプリのRedirect Uriが必要となります。

## デベロッパーとしてログイン

下記URLでログイン、または登録を行います。

[https://developer.ebay.com/signin](https://developer.ebay.com/signin)

## productionを有効にする

### Account deletion用のエンドポイントを作成する

eBay APIでは、sandboxモードとproductionモードがあります。以下の特徴があります。

*   sandbox: 簡単に始めれる。テストユーザーを作成する必要があり、また実際の商品情報は取れないらしい
*   production: 複雑だが、実際のデータが取れる

実際の使用には、productionモードは必須です。これを有効にするために、Account deletion通知を受け取れるようにする必要があります。これにより、アカウント削除などの通知を適切に処理します。

こうした処理を実装した証明のため、eBayからのチャレンジアクセスに対応する必要があります。選択肢は色々あるかと思いますが、例えばglitchなどでサーバーを用意します。

```javascript
///// node.jsでの例。fastifyを使用 /////

const verificationToken = 'xxx'; // 32-80文字。英字・アンダースコア・ハイフンが利用可能

// fastify初期化コード
...

// チャレンジ処理
fastify.get("/", function (request, reply) {
  const challengeCode=request.query.challenge_code;
  const endpoint='https://'+request.hostname;
  const hash = createHash('sha256');
  hash.update(challengeCode);
  hash.update(verificationToken);
  hash.update(endpoint);
  const responseHash = hash.digest('hex');
  reply.header('Content-type','application/json')
  reply.status(200);
  return {"challengeResponse":responseHash};
});

// 通知処理
fastify.post("/", function (request, reply) {

  // ここに通知を処理するコードを書く

  return {"ok":true}
});

// fastify実行コード
...
```

### エンドポイント設定をする

以下のように設定します。

![](https://www.masaakiota.net/wp-content/uploads/2025/03/スクリーンショット-2025-03-16-23.31.41-947x1024.png)

## OAuth2に必要な情報を取得する

### Client ID, Client Secret

Client ID, Client Secretは下記URLから取得できます。

[https://developer.ebay.com/my/keys](https://developer.ebay.com/my/keys)

![](https://www.masaakiota.net/wp-content/uploads/2025/03/スクリーンショット-2025-03-15-17.28.39-1-1024x575.png)

### RuName

RuNameは、リダイレクトURLごとに割り当てられます。手順は以下です。

*   リダイレクトURLを追加
*   RuNameをコピー

[https://developer.ebay.com/my/auth/?env=production&index=0](https://developer.ebay.com/my/auth/?env=production&index=0)

![](https://www.masaakiota.net/wp-content/uploads/2025/03/スクリーンショット-2025-03-15-17.30.31-895x1024.png)
