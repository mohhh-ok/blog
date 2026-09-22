---
title: "【Laravel】Caddyでローカルhttps開発する【Vite】"
pubDate: 2025-02-11
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravelでhttps開発したい

GCPのコールバックで使用する場合に、httpsでないと受け付けてもらえません。一応http://localhostなら、確か受け付けてもらえたのですが、そうすると複数プロジェクトでのクッキーが混在してしまい、開発に難が出ます。プロジェクトごとに固有の開発用ドメインを使いたいといった理由です。

以前にValetで同様のことを行ったのですが、TLDにcomなどを指定すると、YouTubeやGoogleなどの閲覧に支障が出ます。そのため、今回新しく試してみました。

## Caddy

Caddyは本番でも使えるサーバーです。Goで書かれており、高速かつ設定が簡単なのが魅力です。

Macでの方法です。

インストール

```
brew install caddy
```

## 設定する

まずCaddyfileを、プロジェクトルートに設置します。

```
local.xxx.com {
    reverse_proxy localhost:8000
    tls internal
}

```

local.xxx.comへのアクセスを、localhost:8000に割り振っています。localhost:8000は、artisan serveで起動するサーバーを想定しています。またtls internalで、httpsを有効にしています。

/private/etc/hostsファイルに追加します。

```
127.0.0.1 local.xxx.com
```

続いて.envをいじります

```
APP_URL=https://local.xxx.com/

# 以下を追加
ASSET_URL="${APP_URL}"
```

APP\_URLだけで良いかと思っていたのですが、cssなどの読み込みでエラーになりました。なぜかhttpで読み込もうとしていました。そのため、ASSET\_URLをAPP\_URLと同一に指定します。

また、Laravelにhttps使用を強制します。AppServideProvider.phpを以下のようにします。

```
public function boot(): void
  {
    URL::forceScheme('https');
```

Makefileを作ります。

```
dev:
    trap 'kill 0' SIGINT; \
    caddy run --config Caddyfile & \
    php artisan serve & \
    wait
```

trapを指定することで、Ctrl + Cで全て停止できるようになっています。

これで設定完了です。以下のコマンドで起動できます。

```
make dev
```

これで、https://local.xxx.comにアクセスすると、laravel開発サーバーにアクセスできるようになりました。

## Viteに対応する

### 証明書

viteでhttpsに対応するためには、証明書のパスが必要です。Caddyの生成した証明書か、自前で作成した証明書か、どちらかを使用できます。以下のどちらかを選択して下さい。

#### Caddyが生成した証明書を使用する

環境によるかと思いますが、Caddyは以下に証明書を持っています。

```
~/Library/Application\ Support/Caddy/certificates/local/local.xxx.com/local.xxx.com.key
~/Library/Application\ Support/Caddy/certificates/local/local.xxx.com/local.xxx.com.crt
```

これをviteで読み込みます。vite.config.tsを以下のようにします。使用するhostをhost定数として指定しておきます。

```typescript
server: {
        host,
        cors: true,
        https: {
            key: `${process.env.HOME}/Library/Application\ Support/Caddy/certificates/local/${host}/${host}.key`,
            cert: `${process.env.HOME}/Library/Application\ Support/Caddy/certificates/local/${host}/${host}.crt`,
        },
},
```

#### mkcertで自前で用意する

一方、mkcertで自前で用意することもできます。

```bash
brew install mkcert
mkcert -install
cd <プロジェクトディレクトリ>
mkcert local.xxx.com
```

Caddyfileを修正します。

```
local.xxx.com {
    reverse_proxy localhost:8000
    tls local.xxx.com.pem local.xxx.com-key.pem
}
```

vite.config.tsも書き換えます。

```typescript
server: {
        host,
        cors: true,
        https: {
            key: `local.xxx.com-key.pem`,
            cert: `local.xxx.com.pem`,
        },
},
```

### baseを指定する

baseを指定しないと、ビルド後に絶対パスで読み込もうとしてしまうようです。その場合、vite.config.tsにbaseを指定します。

```
base: '',
```
