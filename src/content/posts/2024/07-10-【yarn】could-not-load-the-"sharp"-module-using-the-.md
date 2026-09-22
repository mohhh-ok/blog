---
title: "【Yarn】Could not load the \"sharp\" module using the darwin-arm64 runtime"
pubDate: 2024-07-10
categories: ["未分類"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Mac M2でsharpが使えない

sharpはnode.jsで使える画像ライブラリです。yarnでインストールしようとしたところ、以下のエラーが出ました。

```
Could not load the "sharp" module using the darwin-arm64 runtime
```

## 解決

以下の様にすることで解決しました。

```
yarn add sharp --ignore-engines
```

以下を参考にしています。

https://sharp.pixelplumbing.com/install

ちなみにこれ以外に、brewでvipsを削除すると言う方法もありましたが、私のマシンではそもそもvipsが入っていませんでした。

Mac Siliconは、色々と問題がありますね。AIチップが流通したら、さらにややこしいことになってきそうです。

## 余談

暑いですが、時々雨が降ってくれるのはありがたいですね。といっても、すでに完全防御モードで、エアコン部屋にこもりっきりですが。。。
