---
title: "【Laravel】Valet + Vite + httpsでのエラーを解消する"
pubDate: 2025-02-04
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Valet + Vite

Valetはartisan serveの代わりに使用することのできる、サーバー関連のアレです。これとViteを併用すると、エラーが出てなかなか面倒くさかった思い出ができましたので、メモがわりに残させていただきます。

## 事件概要

今回、valetでhttpsのアクセスを作成しました。ドメインはデフォルトの.testではなく、TLDである.xyzを用いています。するとエラーが発生しました。

## the content must be served over HTTPS

まずvite関連のファイルをhttpsで提供する必要があります。以下はだめな例です。

```typescript
// vite.config.ts
{
  server:{
    https: true,
  }
}
```

## ERR\_SSL\_VERSION\_OR\_CIPHER\_MISMATCH

クライアントとサーバーとで、証明書関連の情報が一致していないようです。Valetの証明書情報を使用する必要があります。

```typescript
// vite.config.ts
{
  server:{
    https: {
      cert: "/Users/<ユーザー名>/.config/valet/Certificates/<ドメイン名>.crt",
      key: "/Users/<ユーザー名>/.config/valet/Certificates/<ドメイン名>.key",
    },
  }
}
```

すると、開発ログにUsing Valet certificate to secure Vite.が出るようになりました。

## ERR\_CERT\_COMMON\_NAME\_INVALID

SSL証明書のドメイン名（Common Name）が実際のアクセス先と一致していないそうです。Viteのファイルへのアクセスに\[::\]が含まれているのに関わらず、証明書が<ドメイン名> 用に発行されているため、この不一致が発生しているとのことです。以下のようにします。

```typescript
// vite.config.ts
{
  host: "<ドメイン名>",
  hmr: {
    host: "<ドメイン名>",
  },
}
```

## blocked by CORS policy

でましたCORSエラーです。以下のようにします。

```typescript
// vite.config.ts
{
  cors: true,
}
```

これで正常に動くようになりました。

## まとめ

まとめると以下のような具合です。

```typescript
// vite.config.ts
{
  server:{
    https: {
      cert: "/Users/<ユーザー名>/.config/valet/Certificates/<ドメイン名>.crt",
      key: "/Users/<ユーザー名>/.config/valet/Certificates/<ドメイン名>.key",
    },
  }
  host: "<ドメイン名>",
  hmr: {
    host: "<ドメイン名>",
  },
  cors: true,
}
```
