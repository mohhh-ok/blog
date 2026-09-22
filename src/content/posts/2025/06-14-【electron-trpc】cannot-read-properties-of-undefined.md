---
title: "【electron-trpc】Cannot read properties of undefined (reading 'serialize')"
pubDate: 2025-06-14
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## electron-trpcでエラー

下記のエラーがでました。

```
TRPCClientError: Cannot read properties of undefined (reading 'serialize')
    at TRPCClientError2.from (@trpc_client.js?v=8e462472:1695:12)
    at TRPCUntypedClient.requestAsPromise (@trpc_client.js?v=8e462472:2898:29)
    at async onClick (InputImagesDirectoryPane.tsx:11:25)
Caused by: TypeError: Cannot read properties of undefined (reading 'serialize')
    at electron-trpc_render…s?v=8e462472:523:31
    at Object.subscribe (electron-trpc_render…js?v=8e462472:35:18)
    at @trpc_client.js?v=8e462472:194:17
    at Object.subscribe (@trpc_client.js?v=8e462472:23:21)
    at startIfNeeded (@trpc_client.js?v=8e462472:94:29)
    at @trpc_client.js?v=8e462472:119:7
    at Object.subscribe (@trpc_client.js?v=8e462472:23:21)
    at @trpc_client.js?v=8e462472:68:31
    at new Promise (<anonymous>)
    at observableToPromise (@trpc_client.js?v=8e462472:58:19)
```

かなりすったもんだした挙句、trpcのバージョンによるものだとわかりました。具体的には、electron-trpc0.7.1が、trpc11に対応できていないようです。

下記でissueが建てられています。

[https://github.com/jsonnull/electron-trpc/issues/184](https://github.com/jsonnull/electron-trpc/issues/184)

PRもあるのですが、まだマージされていません。

余談ですが、すでに議論の対象になっていたことを知らず調子に乗ってissueを投げて速攻で謝ったのは私です。

## 解決

今回、trpcを10系に下げることで解決しました。また下記フォークを使用することでも解決しそうです。

[https://github.com/mat-sz/trpc-electron](https://github.com/mat-sz/trpc-electron)
