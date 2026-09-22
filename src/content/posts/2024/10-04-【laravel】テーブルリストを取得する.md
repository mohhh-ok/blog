---
title: "【Laravel】テーブルリストを取得する"
pubDate: 2024-10-04
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravelでテーブル一覧を取得する

テーブル一覧取得は、以下のSQLコマンドで行えます。

```
SHOW TABLES
```

これをLaravelで書くと、

```php
use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
```

となります。返り値にDB名が含まれているため、欲しいDBのテーブルを抽出します。

```php
$tables = array_map(function ($table) {
    $key = 'Tables_in_' . env('DB_DATABASE');
    return $table->$key ?? null;
}, $tables);
$tables = array_filter($tables);
```

これでテーブル一覧を取得できました。特定のカラムを持つものを抽出する場合は、さらに以下のようにします。

```php
use Illuminate\Support\Facades\Schema;

$tables = array_filter($tables, function ($table) {
    return Schema::hasColumn($table, 'user_id');
});
```

このあたり、ChatGPT様だけに頼ってると痛い目を見ますね。結局自分で検索した方が、正しい情報に辿り着けることも多いです。
