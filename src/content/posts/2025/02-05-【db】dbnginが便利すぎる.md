---
title: "【DB】DBnginが便利すぎる"
pubDate: 2025-02-05
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## DBngin

DBngineは、各種データベースを統合的に管理できるGUIツールです。MacとWin両方のバージョンがあります。

[https://dbngin.com](https://dbngin.com)

Laravel ValetでMySQLもいい感じにしたいと思っていたところ、Laravel公式で紹介されていたので使ってみました。

## 超簡単

GUIアプリをインストールして、サクッと設定すれば、127.0.0.1でDBが使えます。root + 空パスワードで入れます。なお開発環境を想定されているそうです。なぜか検索しても情報が少ないのですが、謎です。一つ一つdbをインストールして起動するより、またDocker使うより、便利だと思います。

## 使えるDB

以下のDBが使えます。

*   PostgreSQL
*   MySQL
*   Redis

## プロファイル管理

各DBで、好きなようにプロファイルを作れます。１つのDBで複数のプロファイルを付けることも可能です。

*   バージョン
*   ポート
*   ソケット
*   データパス
*   コンフィグ

## DB操作用のGUIも

同じグループの、TablePlusを使用すれば、簡単にDB操作もできます。DBnginと連携しているので、すぐに起動できます。

[https://tableplus.com](https://tableplus.com)
