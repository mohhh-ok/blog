---
title: "【Vite】開発サーバーをDocker経由でhttpsにする"
pubDate: 2025-08-31
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Dockerでのhttps

Dockerでのhttpsは、https-portalが便利です。今回はこちらを使って、ローカルサーバーをhttpsにします。

普段の開発サーバー + Dockerの構成です。

## hostsを設定する

ローカルのhosts設定を追加します。local.example.comの場合です。

```
127.0.0.1 local.example.com
127.0.0.1 vite.local.example.com
```

## docker-compose.yml

上記で指定したホストからhost.docker.internalに流すように設定します。ウェブアプリが:8000で動いている想定です。viteは:5173です。

```yaml
services:
  https-portal:
    image: steveltn/https-portal:1
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAINS: >
        local.example.com -> http://host.docker.internal:8000,
        vite.local.example.com -> http://host.docker.internal:5173
      STAGE: local
    volumes:
      - ./https-portal:/var/lib/https-portal
    restart: unless-stopped
```

## vite.config.ts

dockerの証明書を読み込んで使用します。hmrもhttpsにあわせてwssにします。

```typescript
...

const host = "local.example.com";
const viteHost = "vite.local.example.com";
const port = 5173;

// https-portalの証明書パスを取得
const certRoot = `./https-portal/${host}/local`;
const certPath = `${certRoot}/signed.crt`;
const keyPath = `${certRoot}/domain.key`;
const cert = fs.readFileSync(certPath);
const key = fs.readFileSync(keyPath);


export default defineConfig({
  ...
  server: {
    host,
    port,
    cors: true,
    https: {
      cert,
      key,
    },
    hmr: {
      protocol: 'wss',
    },
  },
  ...
});

```
