---
title: "【Laravel】StreamでLeague\\Csv\\WriterのsetOutputBOMは効かない"
pubDate: 2024-12-27
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## LaravelのStream

LaravelではStreamを以下のように書けます。

```php
response()->stream(
    function () {
        echo 'Hello World!';
    },
    200,
    [
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
    ]
);

```

## CSVをBOMと共に出力する

BOMを指定しないと、Microsoft Excelなどの一部のソフトで文字化けします。League WriterはBOMを出力する関数を持っていますが、LaravelのStreamと併用する場合は、なぜか正常に動きません。ヘッダー処理が競合しているためと思われます。

そのため、以下のように直接echoします。

```php
response()->stream(
    function () {
        $csv = Writer::createFromPath('php://output', 'w');

        // 直接BOMを出力する
        echo chr(0xEF) . chr(0xBB) . chr(0xBF);

        // 以下は効かない
        // $csv->setOutputBOM(Writer::BOM_UTF8);

        $csv->insertOne(['a','b','c']);
    },
    200,
    [
        'Content-Type' => 'text/csv; charset=UTF-8',
        'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
    ]
);

```
