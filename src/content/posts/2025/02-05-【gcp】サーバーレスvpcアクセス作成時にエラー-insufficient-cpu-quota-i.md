---
title: "【GCP】サーバーレスVPCアクセス作成時にエラー Insufficient CPU quota in region"
pubDate: 2025-02-05
categories: ["Google Cloud"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## サーバーレスVPCアクセス

Cloud Run Functionsなどのサーバーレスは、VPCに入っていません。そのためVPC関連の機能を使うには、サーバーレスVPCアクセスを作成して、繋げる必要があります。

## 作成できない

以下のエラーで、作成できませんでした。

```
Insufficient CPU quota in region
```

しかしクォータを確認すると、最大8, 現在1となっています。クォータには余裕があるように見えます。

しかしここに罠がありました。

## 最大インスタンス数で判定される

考えてみれば当たり前の話なのですが、最大インスタンス数が判定に用いられるようです。

[https://stackoverflow.com/questions/77592650/how-to-create-a-serverless-vpc-with-paid-billing-account-while-the-free-trial-is?rq=2](https://stackoverflow.com/questions/77592650/how-to-create-a-serverless-vpc-with-paid-billing-account-while-the-free-trial-is?rq=2)

サーバーレスVPCアクセスのデフォルトは、最小インスタンス2, 最大インスタンス10となっています。つまり、+10される計算で、クォータ制限を判定されていました。

最大インスタンスを3に変更することで、無事サーバーレスVPCアクセスを作成することができました。
