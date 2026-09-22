---
title: "【Laravel】Intervention Image v3で画像をresponseする"
pubDate: 2024-10-28
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Intervention Image v3

Intervention Image v3は割と最近v2からアップデートされた関係で、情報が少ないです。そのためChatGPTでは解決しにくい問題も多々あります。

## responseで返す

公式サイトでは、以下のコードが紹介されています。

```php
use Intervention\Image\Laravel\Facades\Image;

Route::get('/', function () {
    $image = Image::read('images/example.jpg');
});
```

これを見ると、特にreturnされたものはありません。そうかPHPはreturnしなくても最後の値を返す仕様だったかな？などという妄想を招くような記述は控えていただきたいです。おそらく単に、呼び出し部分だけ参考として提示されているものと思われます。

試しに$imageをreturnすると以下のエラーとなります。middlewareで発生しました。

```
Symfony\Component\HttpFoundation\Response::setContent(): Argument #1 ($content) must be of type ?string, Intervention\Image\Image given
```

つまり、Imageオブジェクトをそのまま返してもresponseにならないということが分かりました。

以下のようにする必要があります。

```php
return Response::make($image->toWebp(), 200, [
    'Content-Type' => 'image/webp',
]);
```

都度コンバートを呼び出して返す必要があるようです。本当にそれしかないのか、色々探してみましたが結局分からずじまいです。せっかくLaravelと統合されているのだから、resopnse用の関数も欲しいところですね。
