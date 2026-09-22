---
title: "【PHP】fatal error: 'MagickWand/MagickWand.h' file not found"
pubDate: 2025-03-01
categories: ["PHP"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PHPでImage Magickを使いたい

環境は以下です。

*   Mac M2
*   PHPはasdf管理

今回brewでImage Magickをインストールし、peclでPHP拡張機能を入れようとしました。

```
brew install imagemagick
pecl install imagick
```

すると、下記のエラーが。

```
fatal error: 'MagickWand/MagickWand.h' file not found
```

## 解決

brewでpkg-configが入っていなかったことが原因のようです。下記のようにすることで解決しました。

```
brew install pkg-config
```
