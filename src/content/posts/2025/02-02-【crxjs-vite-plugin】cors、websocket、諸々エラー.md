---
title: "【crxjs/vite-plugin】CORS、WebSocket、諸々エラー"
pubDate: 2025-02-02
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## CORS, WebSocket, 色々エラー

crxjs/vite-pluginにまつわるエラーがたくさん出てきました。開発のdevで起動した時の問題です。以下のissuesが建てられています。

[https://github.com/crxjs/chrome-extension-tools/issues/971](https://github.com/crxjs/chrome-extension-tools/issues/971)

```
Access to script at 'http://localhost:5173/@crx/client-worker' from origin 'chrome-extension://gbfkgllkhphjnpfpgfgmpahkbekgeenh' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

```
WebSocket connection to 'ws://localhost:5173/' failed: Error during WebSocket handshake: Unexpected response code: 400 
```

## 原因

viteがCORSに関するセキュリティアップデートを行ったことで、それにvite-pluginが対応できていないことが原因のようです。

影響のあるバージョン

```
Starting with these Vite versions:

=6.0.9

=5.4.12, <6.0.0

=4.5.6, <5.0.0
```

## 解決法

上記issueで紹介されていますが、以下のようにします。なお暫定的な処置です。

```
// manifest.jsonに以下を追加
{
  "host_permissions": [
    "<all_urls>"
  ]
}
```

```
// vite.config.tsに以下を追加
{
  legacy: {
    skipWebSocketTokenCheck: true,
  },
}
```

もう何をしてもエラーになって何がなんやら状態でしたが、issueを見つけてようやく解決できました。
