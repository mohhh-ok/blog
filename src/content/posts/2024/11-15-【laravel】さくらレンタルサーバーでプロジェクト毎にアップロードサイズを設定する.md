---
title: "【Laravel】さくらレンタルサーバーでプロジェクト毎にアップロードサイズを設定する"
pubDate: 2024-11-15
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## さくらレンタルサーバー

さくらレンタルサーバーは、昔からある老舗レンタルサーバーです。現在進行中のプロジェクトでは、以下のような構成になっています。

```
/home/{username}
  - www
    - site1
    - site2
```

このような構成のため、仮にphp.iniを編集すると、すべてのサイトに影響してしまいます。そこでサイト毎に設定する方法を色々調べて実現した結果を書きます。

## チェック用のエンドポイント

以下のようにして、実際に反映されたかどうかをチェックするためのエンドポイントを作成します。

```php
Route::get('/phpinfo', function () {
    return [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
    ];
});
```

## .user.iniでやってみたけど。。。

php.iniと同じ書き方で、サブディレクトリに.user.iniを設置すればいいとのことで、やってみました。

```vim
upload_max_filesize = 50M
post_max_size = 50M
```

しかし実際には、反映されません。通常であれば、最大５分（設定による）待てば更新処理が動いて、正常に反映されるようです。しかしさくらレンタルサーバーはPHPモジュールモードのためか、待てど暮らせど反映されませんでした。悲しい。

## .htaccessで設定できた

以下のように、.htaccessで設定できました。

```apacheconf
<IfModule mod_rewrite.c>
    ...デフォルトのリライト設定
</IfModule>

php_value upload_max_filesize 50M
php_value post_max_size 50M
```
