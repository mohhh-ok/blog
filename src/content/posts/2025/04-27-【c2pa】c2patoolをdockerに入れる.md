---
title: "【C2PA】c2patoolをDockerに入れる"
pubDate: 2025-04-27
categories: ["C2PA"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## c2patool

c2patoolは、c2pa用のcliユーティリティです。c2pa-nodeなどもありますが、ホワイトリストの指定などは2025年4月27日現在、c2patoolを用いる必要があるようです。そのため、Cloud RunなどでC2PAを使用するには、このc2patoolが必要と考え、Dockerfileをつくりました。

## Dockerfile

c2patoolの最新バージョン0.16.4はGLIBC\_2.38を必要とします。これはnode:23やdebian:bookworm-slimイメージでは存在していませんでした。これらの場合、下記のエラーとなります。

```
root@80fecb823451:/# c2patool
c2patool: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found (required by c2patool)
c2patool: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.39' not found (required by c2patool)
```

そのため、ubuntuを使用します。Dockerfileは下記のようになります。

```docker
# M系でも起動できるようplatformを指定
FROM --platform=linux/amd64 ubuntu:24.04

# c2patoolの依存関係をインストール
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# c2patoolをインストール（Linuxバイナリを使用）
RUN curl -fsSL https://github.com/contentauth/c2pa-rs/releases/download/c2patool-v0.16.4/c2patool-v0.16.4-x86_64-unknown-linux-gnu.tar.gz -o c2patool.tar.gz \
  && tar -xzf c2patool.tar.gz \
  && mv c2patool/c2patool /usr/local/bin/ \
  && chmod +x /usr/local/bin/c2patool \
  && rm c2patool.tar.gz
```

試します。

```bash
docker build -t test .
docker run -it test

# 中で実行
c2patool --version
```

無事、0.16.4が表示されました。あとはここに、node.jsなどをインストールして使えば良さそうです。
