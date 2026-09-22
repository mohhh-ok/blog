---
title: "【NestJS】string-widthでERRO_REQUIRE_ESM"
pubDate: 2024-03-30
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## string-widthでエラー

string-widthは、日本語を長さ２として数えてくれるパッケージです。これをNestJSで使おうとすると以下のエラーになりました。

```
Error [ERR_REQUIRE_ESM]: require() of ES Module /xxx/node_modules/string-width/index.js from /xxx/node_modules/wrap-ansi/index.js not supported.
Instead change the require of /xxx/node_modules/string-width/index.js in /xxx/node_modules/wrap-ansi/index.js to a dynamic import() which is available in all CommonJS modules.
```

メッセージを見る限りでは、いじれない部分でエラーになっているようです。GPT4に聞いてもさっぱり解決せず、ネットサーフィンするとすぐに解決策が出てきました。

以下のissueが建てられています。

https://github.com/yarnpkg/yarn/issues/8994#issuecomment-1926209717

これによると、以下のようにすればいいとのことでした。

```
"dependencies": {
    "string-width": "4.2.3",
},
"resolutions": {
    "string-width": "4.2.3"
}
```

GPT4に聞いてみたところ、依存関係にあるパッケージに、強制的にver4.2.3を使うように指定しているそうです。これで解決しました。

## 余談

たまにはゆっくりお菓子作りとかしてみたいです。最近は料理もまったくしなくなりました。カモン、時間。
