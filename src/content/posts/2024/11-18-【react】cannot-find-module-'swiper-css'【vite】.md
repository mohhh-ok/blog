---
title: "【React】Cannot find module 'swiper/css'【Vite】"
pubDate: 2024-11-18
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Swiper

Swiperはスライドショーを簡単に作れるライブラリです。

## エラー内容

Viteでbuildしようとした際、以下のエラーが出ました。

```
error TS2307: Cannot find module 'swiper/css' or its corresponding type declarations.

import 'swiper/css';
```

## 解決

vite-env.d.tsに以下の行を追加することで解決しました。

```
declare module 'swiper/css';
```

viteは便利ですが、ちょくちょく問題が起きますね。しかし便利です。
