---
title: "Larvel無しでIlluminate Database使用時にEvent発火しない問題"
pubDate: 2023-08-31
categories: ["Laravel"]
tags: []
---

こんにちは。フリーランスエンジニアのmohです。

最近ちょっと涼しくなって、またエアコンなしでも行けるかなとガンガン扇風機を回しています。

## Illuminate Databaseでイベントが発火しない

Larvelを使ったことのない私ですが、DjangoのようなORMモデルを使用したいと探した結果、とりあえずIlluminate Databaseを使用しています。これはもともとLarvelに搭載されているもので、それを単体で使っているわけですが、以下の問題が発生しました。

どうやってもイベントが発火しない。。。

ライブラリにprint文を加えたり、ChatGPT大先生とすったもんだしながら、ようやく以下の解決方法が出てきましたので、共有させていただきます。

## Illuminate Database単体でもイベント発火させる

結論としましては、まずEventsをComposerに加えます。

```
composer require illuminate/events
```

そして、以下の「ここ」の部分数行をコードに加えるだけです。

```php
use \Illuminate\Database\Capsule\Manager as DB;
use \Illuminate\Events\Dispatcher;
use \Illuminate\Container\Container;

$db = new DB;

$db->addConnection([
    'driver'   => 'sqlite',
    'database' => SQLITE_DB_FILE,
    'prefix'   => '',
]);

// ここ。イベントディスパッチャを手動で設定
$dispatcher = new Dispatcher(new Container());
$db->setEventDispatcher($dispatcher);
```

## 最後に

最近リカーマウンテンにはまってます。メガ盛りカレーが美味しい割にめちゃ安いので、行けば3,4つはまとめ買いしています。
