---
title: "【PHP】array_filter後は連想配列になったりならなかったり"
pubDate: 2024-06-26
categories: ["PHP"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PHPのarray\_filter

PHPでは、配列のフィルターを以下の様にします。

```php
$newArray = array_filter($array, function($item){
    return $item->isEnabled;
});
```

ここで気をつけなければいけないのが、PHPは連続した配列と連想配列とが区別がつきません。そしてarray\_filterを使った後、キーの連続性が失われなければ連続した配列のままですが、連続性が失われれば勝手に連想配列にされます。発狂しそうです。

そこで以下の様にします。

```php
$newArray = array_filter($array, function($item){
    return $item->isEnabled;
});
$newArray = array_values($newArray);
```

これでとりえあず、連続した配列が担保されます。もうPHP触りたくないです。

## 余談

一時期ウィスキーにハマっていたのですが、いつのまにか飲まなくなってました。デスクの上に、いつまでも使われないおしゃれグラスが鎮座しています。
