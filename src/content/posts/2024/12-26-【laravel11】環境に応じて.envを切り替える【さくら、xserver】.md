---
title: "【Laravel11】環境に応じて.envを切り替える【さくら、XServer】"
pubDate: 2024-12-26
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravelの.env

Laravelでは、デフォルトでルートの.envを読み込みます。

今回は、それを環境で切り替える方法です。Laravel11では、bootstrap/app.phpファイルがあります。これをいじります。

## Web表示だけでいいなら$\_SERVER

php artisanを想定していなければ、$\_SERVERで大丈夫です。下記はbootstrap/app.phpファイルに追記する部分です。さくらレンタルサーバーとXServerに対応しています。なお環境によってはキーや値が違ったりしますので、適時変更してください。

```php
function loadCustomEnv()
{
  $isSakura = str_ends_with($_SERVER["HOST"] ?? '', ".sakura.ne.jp");
  $isXServer = isset($_SERVER['HTTP_X_SERVER_ADDRESS']);
  $isProduction = $isSakura || $isXServer;
  if ($isProduction) {
    Dotenv::createImmutable(dirname(__DIR__), '.env.production')->load();
  }
  Dotenv::createImmutable(dirname(__DIR__), '.env')->load();
}

loadCustomEnv();
```

.env.productionは以下のようにします。

```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=http://sakura.example.com

// 残りは.envから読み込まれる。
```

## artisanにも対応する

artisanにも対応するには、ベストプラクティスは思いつきませんでした。次善の策として、プロジェクトディレクトリ名を使用する方法があります。ローカルではwebディレクトリ、サーバー上ではstaging.xxx.comやxxx.comなどといったディレクトリに格納するといった前提なら、下記のように行えます。bootstrap/app.phpです。

```php
function loadEnvs()
{
  // プロジェクトディレクトリ名毎の.envファイルを指定する
  $envFiles = [
    'web' => '.env.local',
    'staging.xxx.com' => '.env.staging',
    'xxx.com' => '.env.production',
  ];

  $projectDir = basename(dirname(__DIR__));
  $envFile = $envFiles[$projectDir] ?? null;
  if (!$envFile) {
    throw new Exception('Invalid project directory ' . $projectDir);
  }
  $dotenv = Dotenv::createImmutable(dirname(__DIR__), $envFile);
  $dotenv->load();
  $dotenv = Dotenv::createImmutable(dirname(__DIR__), '.env');
  $dotenv->load();
}

loadEnvs();

```

## 結局.env１つが最強？

こうした.envの環境による使い分けを色々考えました。

しかし結局１つの.envを使う方が、下記の点で優れているかと思います。

*   複数人開発でも混乱しない（.envはgit管理しないため）
*   サーバーで編集して、ローカルからアップロードしないようにするだけでOK

サーバーによっては環境変数を設定できたりするのですが、PHP + レンタルサーバーの需要も多いのでなかなか。

結論、.envは面倒だというお話でした。
