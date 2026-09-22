---
title: "【Laravel】Undefined type 'Intervention\\Image\\Facades\\Image'"
pubDate: 2024-07-30
categories: ["Laravel"]
tags: []
---

こんにちは！フリーランスエンジニアのmohです。

## Laravelで画像リサイズをしたい

GPTさんにお伺いしたところ、Intervention/Imageを使用すると良いよとのことでした。さっそくcomposerして使用したのですが、下記のエラーが出ます。

```
【Laravel】Undefined type 'Intervention\Image\Facades\Image'
```

どないせいちゅうねん。

## ライブラリアップデートのため、Laravel用にインストールする必要がある

下記に記載されていました。

https://image.intervention.io/v3/introduction/frameworks

具体的には以下の様になります。

```
composer require intervention/image-laravel
php artisan vendor:publish --provider="Intervention\Image\Laravel\ServiceProvider"
```

使用方法は以下です。

```php
use Intervention\Image\Laravel\Facades\Image;

Route::get('/', function () {
    $image = Image::read('images/example.jpg');
});
```

IT業界は日々変化しますねー。

## 余談

最近なか卯の朝食の味噌汁が薄い気がします。材料をケチっているのか、あるいは単なるミスなのか。もうちょっと濃いのが個人的には好みなので、なか卯さんには是非とももう少し濃くしていただけると嬉しいなと。
