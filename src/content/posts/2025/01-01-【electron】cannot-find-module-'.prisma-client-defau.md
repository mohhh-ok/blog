---
title: "【Electron】Cannot find module '.prisma/client/default'"
pubDate: 2025-01-01
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Electron

Electronは、JavaScriptでデスクトップアプリを作れるツールです。

## Prismaでエラーになる

devモードなら問題なかったのですが、buildすると以下のエラーになりました。

```
Cannot find module '.prisma/client/default'
```

## 対策

### 成果物にprismaを含める

以下のように、package.jsonに追記します。npmの場合です。

```json
"build": {
  "extraResources": [
    "prisma/**/*",
    "node_modules/.prisma/**/*",
    "node_modules/@prisma/client/**/*"
  ]
}
```

### パッケージマネージャーに気をつける

これは単にケースバイケースです。node\_modules内の構成が変わるのですが、ネットで紹介されていた解決策との整合性がとれず、四苦八苦しました。パッケージマネージャーには気をつけましょう。

### prismaをやめる

2025/01/05追記： 頑張ってPrismaでクロスプラットフォームをやってみました。下記で公開しています。

https://www.masaakiota.net/2025/01/05/%e3%80%90electron%e3%80%91prisma-sqlite%e3%82%92%e3%82%af%e3%83%ad%e3%82%b9%e3%83%97%e3%83%a9%e3%83%83%e3%83%88%e3%83%95%e3%82%a9%e3%83%bc%e3%83%a0%e3%81%a7%e3%83%93%e3%83%ab%e3%83%89%e3%81%99

そもそも、prismaはクロスプラットフォームに弱いようです。バイナリを含むためだそうです。成果物に無理やりPrismaを含めても、対応バイナリがなければ意味がありません。

ただprismaのバイナリは、prisma.schemaでbinaryTargetsを指定すれば、意図したプラットフォームのものを作成できるようです。windows（たぶんintel）, mac intel, mac armなどがあります。ただ、おそらくwindows armがありません。mac arm上で動作するvmware fusionはwindows armなので、これは困りものです。。。

ChatGPTによれば、better-sqlite3なら、Electronでのクロスプラットフォームに対応しているためお勧めだとのことでした。
