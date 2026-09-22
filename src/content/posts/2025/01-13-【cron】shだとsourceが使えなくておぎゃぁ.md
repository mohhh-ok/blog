---
title: "【Cron】shだとsourceが使えなくておぎゃぁ"
pubDate: 2025-01-13
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Cronだと環境が違う

Cronで実行する場合、色々と環境が変わってしまいます。以下のようにチェックします。

```
* * * * * env > ~/cron.log
```

```
HOME=/home/masaaki
LOGNAME=masaaki
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
LANG=C.UTF-8
SHELL=/bin/sh
PWD=/home/masaaki
```

ここで注目するのはSHELL=/bin/shとなっている点です。sourceコマンドはbashのみで、shでは使えません。ちなみにgamesというディレクトリがありますが、別にゲームをしているわけではありません。ubuntuのデフォルトディレクトリでしょうか？

## bashに変更する

以下のようにします。

```
SHELL=/bin/bash
* * * * * source ~/.bashrc && your-command
```
