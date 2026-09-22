---
title: "【Laravel】XServerでPHPとComposerのバージョンを上げる"
pubDate: 2025-01-09
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## XServer

XServerで、PHPが7系、Composerも古く、Laravelが11が使えませんでした。そこでPHPとComposerのバージョンを上げたお話です。

## PHPのバージョンを上げる

以下のようにして、シンボリックリンクを作成します。$HOME/bin/phpが存在してリンクを作成できない場合は、削除してから実行します。

```
ln -s /usr/bin/php8.3 $HOME/bin/php
```

## Composerのバージョンを上げる

composer self-updateが使えなかったため、公式サイトに従ってインストールしました。最後のcomposer.pharは、$HOME/bin/composerに入れました。

https://getcomposer.org/download/
