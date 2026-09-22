---
title: "【Google Cloud】aertje/cloud-tasks-emulatorをhttps環境で使う"
pubDate: 2025-11-02
categories: ["Google Cloud"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Cloud Tasksのエミュレータ

現在公式FirebaseエミュレータにCloud Tasksは入っていません。そこでaertje/cloud-tasks-emulatorを使います。

[https://github.com/aertje/cloud-tasks-emulator](https://github.com/aertje/cloud-tasks-emulator)

## 問題点

ここで問題があります。ローカルでhttp開発している分には大丈夫かと思うのですが、httpsだと使えません。ローカルでは通常自己証明証を使ってhttpsを使用しますが、この自己証明書が問題のようです。

```
Post https://local.xxx.net:3000/yyy:⁠ x509: certificate signed by unknown authority
```

issueも建てられていますが、解決の目処は立っていないようです。

[https://github.com/aertje/cloud-tasks-emulator/issues/106](https://github.com/aertje/cloud-tasks-emulator/issues/106)

このissueでは、Dockerのビルドからカスタムする方法が紹介されていますが、これだけのために余計なファイルは増やしたくありません。困りました。

## リバースプロキシを使う

そこでリバースプロキシを使うことにしました。エミュレータ=>http=>httpsの流れなら、自己署名証明書を使っていても問題ありません。

```
# compose.yml
...
  caddy-proxy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "8080:8080"
    command: caddy reverse-proxy --from :8080 --to https://host.docker.internal:3000 --insecure
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

テストします。

```
curl http://localhost:8080/yyy
```

これでhttp=>httpsの導線を作れました。ただしこのアドレスはホスト側なので、docker内でのURLにする必要があります。

```
client.createTask({
  parent,
  task: {
    httpRequest: {
      url: "http://caddy-proxy:8080/yyy",
      ...
```

これでtaskが成功しました。
