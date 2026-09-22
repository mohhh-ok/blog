---
title: "【Drizzle】Invalid URLエラーを解決する"
pubDate: 2025-04-27
categories: ["Drizzle"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## DrizzleでInvalid URL

下記のようなurlを使用すると、エラーになりました。

```
postgresql://user:pass@project:region:instance/db
```

これはCloud SQLの接続名を使用しています。Drizzleはこれをパースできずに、Invalid URLエラーを投げてしまいます。

## 解決策

下記のようにすることで、解決しました。

```
postgresql://user:pass@localhost/db?host=/cloudsql/project:region:instance
```

なおlocalhostとしているのは、Cloud Runの設定でCloud SQL接続を入れているためです。詳細はまだ理解しきれていませんが、localhost経由で接続できるようになるようです。

設定は下記のようになっています。

*   Cloud SQLはPublic IP
*   Cloud RunでCloud SQL接続を有効化
*   Cloud Runでネットワークアクセスを設定する（トラフィック ルーティング:プライベート IP へのリクエストのみを VPC にルーティングする）

下記サイトを参考にさせていただきました。

[https://zenn.dev/google\_cloud\_jp/articles/cloudrun-cloudsql](https://zenn.dev/google_cloud_jp/articles/cloudrun-cloudsql)
