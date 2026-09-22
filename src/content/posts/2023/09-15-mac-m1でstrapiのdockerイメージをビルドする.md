---
title: "Mac M1でStrapiのDockerイメージをビルドする"
pubDate: 2023-09-15
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

WindowsはVistaまでしか経験がありません。その後PCから離れていたのですが、再開したのはMacでした。で、最近安かったのでMac Miniを購入したのですが、これがM1チップなので色々と問題が多発します。今回は、Strapiでの問題と解決です。

## Strapi 公式Dockerfile

すでにビルドされたStrapiイメージもありますが、バージョンが古かったので自前でビルドすることにしました。公式で紹介されていたのは、以下のDockerfileです。

```docker
FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN chown -R node:node /opt/app
USER node
RUN ["npm", "run", "build"]
EXPOSE 1337
CMD ["npm", "run", "develop"]

```

ところがこれが途中でエラーになります。原因は、ローカルで生成したnode\_modulesが、Mac M1チップ用のため、Docker環境で一致しないことでした。

## 改善版 Dockerfile

以下が、改善版です。まず、.dockerignoreに以下を書き込みます。

```
node_modules
```

Dockerfileです。Chat GPT4先生にお世話になりました。

```docker
FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# /opt/ に package.json と package-lock.json をコピー
WORKDIR /opt/
COPY package.json package-lock.json ./

# 依存関係のインストール
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm ci

# PATH を設定
ENV PATH /opt/node_modules/.bin:$PATH

# アプリケーションコードをコピー。.dockerignore に記載されたファイルはコピーされない
WORKDIR /opt/app
COPY . .

# 所有権の変更
RUN chown -R node:node /opt/app

# ユーザーを node に変更
USER node

# ビルド
RUN npm run build

# ポートを開放
EXPOSE 1337

# アプリケーションを実行
CMD ["npm", "run", "develop"]

```

こうすることで、ローカルのnode\_modulesを使用せず、ベースイメージ上でnode\_modulesを生成することになり、問題が解決します。
