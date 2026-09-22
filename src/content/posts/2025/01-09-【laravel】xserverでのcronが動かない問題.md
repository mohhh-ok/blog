---
title: "【Laravel】XServerでのCronが動かない問題"
pubDate: 2025-01-09
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## XServer

XServerでは、CLIのPHPバージョンが古かったり、Composerが古かったりする問題がありました。それに関しては、以下で解説しています。

https://www.masaakiota.net/2025/01/09/%e3%80%90laravel%e3%80%91xserver%e3%81%a7php%e3%81%a8composer%e3%81%ae%e3%83%90%e3%83%bc%e3%82%b8%e3%83%a7%e3%83%b3%e3%82%92%e4%b8%8a%e3%81%92%e3%82%8b/

## Cron動かない問題

サーバーパネルからGUIで以下のように設定しました。

```
cd /home/xxx/yyy/public_html && php artisan schedule:run >> /dev/null 2>&1 
```

確認します。

```
ps aux | grep artisan
```

動いてません。一体どうしてなのか。色々調べてもわからなかったのですが、ふと思いつきました。

あれ、PHPのバージョンどうなってるんやろう。

以下のように、PHPのパスを指定してみました。

```
cd /home/xxx/yyy/public_html && /usr/bin/php8.3 artisan schedule:run >> /dev/null 2>&1 
```

動きました。

## 原因

今回、phpのバージョン上げにはシンボリックリンクを~/bin/phpに指定するという方法をとっていました。しかしcronからの実行は、ユーザー関係ないのでしょうか。そのままデフォルトのphpを使用していたのだと思われます。ともあれひとまず安心です。
