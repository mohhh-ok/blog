---
title: "【Laravel】laravel-imapで指定uid以降のメッセージを取得する"
pubDate: 2025-08-30
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## LaravelでのIMAP

LaravelでのIMAPは、いろいろあるのだろうと思いますが、今回はwebklex/laravel-imap: ^6.2を使用しました。

## 指定uid以降のメッセージを取得

以下のようにすれば、指定uid以降のメッセージを取得できます。

```php
use Webklex\IMAP\Facades\Client;
use Webklex\PHPIMAP\IMAP;

$host = env('IMAP_HOST');
$mailbox = 'INBOX';
$lastUid = 5;
$limit = 10;

$client = Client::make([
  'host'          => $host,
  'port'          => (int) env('IMAP_PORT', 993),
  'encryption'    => env('IMAP_ENCRYPTION', 'ssl'),
  'validate_cert' => filter_var(env('IMAP_VALIDATE_CERT', true), FILTER_VALIDATE_BOOLEAN),
  'username'      => env('IMAP_USERNAME'),
  'password'      => env('IMAP_PASSWORD'),
  'protocol'      => env('IMAP_PROTOCOL', 'imap'),
  'uid'           => true,
  'timeout'       => (int) env('IMAP_TIMEOUT', 30),
]);

$client->connect();
$folder = $client->getFolder($mailbox);

$messages = $folder
  ->messages()
  ->setSequence(IMAP::ST_UID) // シーケンスをuidに指定
  ->from('xxx@example.com') // FROMを指定。なくてもいい
  ->where("CUSTOM UID {$lastUid}:*")
  ->limit($limit) // limit
  ->get(IMAP:FT_PEAK) // 既読にしない
```

## Gmailだと別の方法が必要

Gmailの場合は独特で、個別対応が必要なようです。
