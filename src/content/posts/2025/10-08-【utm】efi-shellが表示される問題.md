---
title: "【UTM】EFI Shellが表示される問題"
pubDate: 2025-10-08
categories: ["未分類"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## UTM

UTMはMacで使えるエミュレータです。ARMにも対応しているとのことで使ってみました。Windowsなどをエミュレートできます。

## EFIに落ちる

起動してなぜかブートしません。毎回EFIに落ちます。Shellで直接叩いてもブートしません。

解決はここにありました。

[https://docs.getutm.app/guides/windows](https://docs.getutm.app/guides/windows)

> First, make sure that you pressed any key during boot to enter the installer.

キーボードを叩けとのことです。仰せの通りキーボードを叩けば無事インストーラが起動しました。
