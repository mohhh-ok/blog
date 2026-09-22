---
title: "【Cloud Run】関数デプロイでImportError: libexpat.so.1: cannot open shared object file: No such file or directory"
pubDate: 2025-02-08
categories: ["Google Cloud", "Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Cloud Runでの関数デプロイ

Cloud FunctionsはCloud Run Functionsとリブランディングされました。しかしこの辺りまた整理がついていないのか、Cloud Run 関数と、Cloud Runで関数をデプロイするのとで、動作が違うようです。具体的には、以下の点で違いがあります。

*   Cloud Run 関数 => VPC接続が面倒
*   Cloud Runでの関数デプロイ => VPC接続が簡単

Cloud Run 関数では、VPC接続にサーバーレスVPCアクセスが必要となります。しかしCloud Runでの関数デプロイは必要ありません。これは朗報だと、Cloud Runでの関数デプロイをしようとしました。

## No such file or directory

下記のrequirements.txtです。

```
functions-framework==3.*
youtube_transcript_api==0.6.3
```

この、youtube\_transcript\_apiをインポートすると、デプロイ時にエラーになりました。libexpat.so.1がないとのことです。これはrequirements.txtでは解決しない問題です。

## ベースイメージを変更して解決

Python3.11を指定していたのですが、さらにベースイメージも選択できます。Ubuntu 22か、Ubuntu 22 Fullが選べます。これを、Ubuntu 22 Fullに変更することで、問題は解決しました。ふう。
