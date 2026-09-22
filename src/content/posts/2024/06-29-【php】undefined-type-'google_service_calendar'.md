---
title: "【PHP】Undefined type 'Google_Service_Calendar'"
pubDate: 2024-06-29
categories: ["PHP"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 実行できるのに。。。

今回、実行はできるのにシンタックスでエラーになる現象がありました。

具体的には、以下のコードです。インターネッツを参照して作成したコードです。

```php
<?php

require __DIR__ . "/vendor/autoload.php";

use Google_Service_Calendar

var_dump(Google_Service_Calendar::CALENDAR_READONLY);
```

GPT先生も当てにならない。と思いきや、何度か聴いてると答えを出してくれました。

以下の様に書かないといけない様です。

```php
<?php

require __DIR__ . "/vendor/autoload.php";

use Google\Service\Calendar;

var_dump(Calendar::CALENDAR_READONLY);
```

ライブラリのバージョンアップに伴って、書き方が変わっていた様です。

## 余談

好きな音楽を聞いてる時が幸せです。
