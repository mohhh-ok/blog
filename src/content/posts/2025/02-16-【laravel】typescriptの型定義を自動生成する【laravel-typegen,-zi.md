---
title: "【Laravel】TypeScriptの型定義を自動生成する【laravel-typegen, ziggy】"
pubDate: 2025-02-16
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravelの悩み

LaravelはPHPで書かれています。TypeScriptのような型安全性はないため、Next.jsなどに比べるとどうしても開発のしにくさが出てきます。バックエンドは割り切るにしても、せめてフロントエンドのTypeScriptでは安心して作業したい。そんな要望を解決するため模索します。

## laravel-typegen

今回、laravel-typegeを使用します。

[https://github.com/7nohe/laravel-typegen](https://github.com/7nohe/laravel-typegen)

php artisan model:showからデータを抽出するようで、データの正確性は高そうです。

## インストールとモデル型定義生成

インストールはシンプルです。

```
npm install -D @7nohe/laravel-typegen
composer require doctrine/dbal
```

package.jsonを下記のようにします。

```javascript
{
    "scripts": {
        "typegen": "laravel-typegen"
    },
}
```

実行します。これで、js/types/model.tsにモデルの型定義ファイルが生成されました。便利ですね！

## ziggyのroute生成

ziggyのroute生成は、以下のようにすれば追加で生成するようです。

```javascript
{
    "scripts": {
        "typegen": "laravel-typegen --ziggy"
    },
}
```

ただ生成されるのはvue用なのでしょうか。Reactで使う方法が分かりませんでした。

ziggyのrouteは、ziggy-jsでも作成できるので、代わりにこちらを使用します。package.jsonを変更します。

```javascript
{
    "scripts": {
        "typegen": "php artisan ziggy:generate --types && laravel-typegen"
    },
}
```

これで、ziggy.d.tsファイルが生成されます。以下のようにすれば、補完が効きます。

```
route('users.index');
```

ただ存在しない値を入れてもエラーになりません。ここがどうにかなれば嬉しいのですが、ひとまずはこの辺りにしておきます。
