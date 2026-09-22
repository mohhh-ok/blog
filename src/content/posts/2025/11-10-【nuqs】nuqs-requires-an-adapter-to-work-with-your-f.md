---
title: "【Nuqs】nuqs requires an adapter to work with your framework"
pubDate: 2025-11-10
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 環境

nuqs: 2.7.1

## モノレポでのnuqsの扱い

モノレポでは複数箇所でnuqsをインストールすることも多々あるかと思います。しかし複数で別のインスタンスが生成されてしまい、Adaptorが認識されない問題があるようです。

[https://github.com/47ng/nuqs/issues/798](https://github.com/47ng/nuqs/issues/798)

Viteのdevでは発生しないため、本番で突然エラーになるといったことになります。

## nuqsを一本にする

一本化するにはいろいろ方法はあるかと思いますが、今回は再エクスポートすることにしました。

```typescript
// src/nuqs/nuqs.ts

export * from "nuqs";
export * from "nuqs/adapters/tanstack-router";
```

```json
{
  "name": "@repo/ui",
  "exports": {
    ".": "./src/index.ts",
    "./nuqs": "./src/nuqs/nuqs.ts"
```

これで大丈夫です。
