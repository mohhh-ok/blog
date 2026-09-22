---
title: "【Laravel】一瞬でLaravelエラーを日本語化する"
pubDate: 2025-02-05
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravelの日本語化

Laravelには.envでlocale設定するところがあります。しかしこれを設定しただけでは、エラー文字は日本語化されません。翻訳ファイルを用意する必要があります。

## 一瞬で日本語化する

世の中は捨てたものではありません。誰かが作ってくれた翻訳ファイルを、一瞬で入れることができます。

その方法は以下で書かれています。

[https://laravel-lang.com/packages-lang.html](https://laravel-lang.com/packages-lang.html)

まず.envの該当箇所をjaにします。

```
APP_LOCALE=ja
APP_FALLBACK_LOCALE=ja
APP_FAKER_LOCALE=ja_JP
```

続いて下記のコマンドを打ちます。

```
composer require --dev laravel-lang/lang
php artisan lang:update
```

はい、これで終わりです。お疲れ様でした。
