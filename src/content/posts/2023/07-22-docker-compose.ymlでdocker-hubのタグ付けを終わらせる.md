---
title: "docker-compose.ymlでDocker Hubのタグ付けを終わらせる"
pubDate: 2023-07-22
categories: ["開発"]
tags: []
---

こんにちは。

最近Djangoを勉強し始めて、ようやく理解できてきました、フリーランスエンジニアのmohです。

今回、生まれて初めてDocker Hubを使用して本番サーバー環境を構築しようとしています。色々調べながら、以下の点に気づきましたので共有させていただきます。

## 本題

Docker Hubにpushする時、通常は以下のようにすると思います。

```
docker build -t your-image-name
docker tag your-image-name:latest your-username/your-image-name:1.0.0
docker push your-username/your-image-name:1.0.0
```

しかし、docker-compose.ymlを以下のようにすれば

```
version: '3'

services:
  myapp:
    build: .
    image: your-username/your-image-name:1.0.0

```

次のコマンドだけでpushできます。

```
docker compose build
docker push your-username/your-image-name:1.0.0
```

っていうお話でした。
