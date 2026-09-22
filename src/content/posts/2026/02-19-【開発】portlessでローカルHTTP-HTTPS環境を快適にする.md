---
title: 【開発】portlessでローカルHTTP/HTTPS環境を快適にする
pubDate: 2026-02-19
categories: ["開発"]
---

こんにちは、フリーランスエンジニアのmohです。

## ローカル開発の地味な悩み

ローカル開発では、地味に面倒な問題がいくつかあります。

- `localhost`で複数プロジェクトを動かすと、ポートが違ってもクッキーが共有されてしまう
- OAuthなどでHTTPSが必要なのに、証明書の管理やhostsの編集が煩わしい
- Caddyやnginxなどのセットアップをチームメンバーに周知するのが手間

portlessはこれらをまとめて解決してくれるツールです。

## portless

portlessは、ローカル開発環境を手軽に改善してくれるツールです。Vercelの開発チーム（vercel-labs）によるものなので安心感があります。リリースからまだ日が浅いですが、スターはすでに1.3Kを超えています。

https://github.com/vercel-labs/portless

portlessの主な特徴は以下の通りです。

- `myapp.localhost` のようなローカルドメインを自動的に解決してくれる（hostsの編集不要）
- 自己証明書の生成・管理を自動で行ってくれる
- システムの信頼ストアへのCA登録も自動

## portlessの嬉しいところ

### クッキーの分離

`localhost`で複数のプロジェクトを開発していると、ポートが違っても同じドメインなのでクッキーが共有されてしまいます。portlessを使えばプロジェクトごとに `myapp.localhost`、`otherapp.localhost` のように異なるドメインを割り当てられるので、クッキーが自然と分離されます。HTTPでも恩恵を受けられるポイントです。

### チームでの共有が楽

portlessはnpmパッケージなので、`devDependencies`に入れてしまえばチーム全員が同じ環境を使えます。CaddyやnginxなどのシステムレベルのツールをREADMEに書いて各自インストールしてもらう必要がなく、`pnpm install`だけで済むのは大きいです。

### ローカルHTTPSが簡単に手に入る

ローカルでHTTPSを使おうとすると、hostsファイルに独自ドメインを登録し、自己証明書を用意して、そのパスをスクリプトに渡す……といった作業が必要です。portlessならコマンド一発でこれらを済ませてくれます。

## portlessの使い方

### インストール

ひとまずViteで試してみたのですが、PORT環境変数周りが面倒そうでした。環境変数の設定さえ行えばViteでも大丈夫かとは思いますが、一旦動作させたいので、公式説明にもあるようにNext.jsで進めます。

```
pnpm create next-app@latest portless-test --yes
cd portless-test
pnpm i -D portless
```

### HTTPで使用する

まずはHTTPで試してみます。以下のコマンドで起動します。`myapp`の部分は任意の名前を指定できます。

```
pnpm portless myapp next
```

```
portless

-- myapp.localhost (auto-resolves to 127.0.0.1)
-- Proxy is running
-- Using port 4687

  -> http://myapp.localhost:1355

Running: PORT=4687 next

▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:4687
- Network:       http://192.168.10.119:4687
```

`myapp.localhost:1355` でアクセスできるようになります。内部的には空いているポートを自動で割り当て、プロキシ経由でアクセスする仕組みです。

### HTTPSで使用する

HTTPSで使用するには、事前にproxyを立ち上げる必要があります。初回起動時にはパスワードを求められます。

```
pnpm portless proxy start --https
```

```
Ensuring TLS certificates...
Generated local CA certificate.
Adding CA to system trust store...
CA added to system trust store. Browsers will trust portless certs.
HTTPS/2 proxy started on port 1355
```

proxyはバックグラウンドで起動するため、すぐにターミナルが戻ってきます。そのまま通常通りportlessでアプリを起動します。

```
pnpm portless myapp next
```

```
portless

-- myapp.localhost (auto-resolves to 127.0.0.1)
-- Proxy is running
-- Using port 4113

  -> https://myapp.localhost:1355

Running: PORT=4113 next

▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:4113
- Network:       http://192.168.10.119:4113

✓ Starting...
✓ Ready in 339ms
```

URLが `https://` になっていることが確認できます。ブラウザで開くと証明書の警告が出るため、判断して進みます。

### proxyの停止

proxyを停止するには以下のコマンドを実行します。

```
pnpm portless proxy stop
```

## まとめ

portlessを使えば、ローカルHTTPSの構築はもちろん、クッキー分離やチーム共有の手軽さなど、日常的な開発体験の改善が期待できます。npmパッケージとして導入できる手軽さもあり、とりあえず入れておいて損はなさそうです。
