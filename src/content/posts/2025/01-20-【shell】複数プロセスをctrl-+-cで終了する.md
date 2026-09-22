---
title: "【Shell】複数プロセスをCtrl + Cで終了する"
pubDate: 2025-01-20
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 複数プロセス

開発には複数プロセスを並列起動することがよくあります。例えば以下のような具合です。

```bash
dart run build_runner watch & \
flutter run -d
```

上記では、コード生成と実行を並列処理しています。

ところが問題があります。上記実行した時、Ctrl + Cで終了すると、build\_runnerが残ってしまいます。こうなると、プロセスを確認して終了する必要が出てきます。

## トラップを仕込む

プロセスが終了せず残ってしまう問題を解決するため、以下のようにトラップを仕込みます。

```bash
trap 'kill 0' SIGINT; \
dart run build_runner watch & \
flutter run -d & \
wait
```

上記では、SIGINTが送信される（Ctrl + Cが押される）と、kill 0が実行されます。kill 0はプロセスグループのプロセスを全て終了します。これにより、安全に開発を進めることができます。
