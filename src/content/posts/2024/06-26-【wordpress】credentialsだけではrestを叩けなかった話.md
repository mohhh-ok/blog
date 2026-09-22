---
title: "【WordPress】credentialsだけではrestを叩けなかった話"
pubDate: 2024-06-26
categories: ["PHP"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## WordPressのRest API

WordPressではRest APIが用意されており、また自分で作成することもできます。

今回、以下の様に作成しました。

```php
class SimpleApi
{
    public function __construct($key, $useGroup)
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes()
    {
        register_rest_route("xxx", "/yyy",  array(
            'methods' => 'POST',
            'callback' => array($this, 'post_action'),
            'permission_callback' => function ($request) {
                return current_user_can('edit_posts');
            },
        ));
    }

    ...
```

パーミッションで、編集権限のあるユーザーのみ可能としています。

## fetchで弾かれる

これで、以下の様にすればいけるはずです。

```javascript
fetch(url, {
    method: 'post',
    credentials: 'same-origin'
});
```

Chromeの開発コンソールで確認すると、確かにクッキーが送信されています。でもなぜか、認証されてないと言われてしまいました。試しにapiの中でユーザー情報を取得してみると、ログインしてないようです。。。

## nonceを入れてみた

gpt4先生も当てにならないもので、結構時間がかかってしまいました。httpsじゃないといけないのか、apiパスを?rest\_route=形式でやっているのがまずいのか、いまいちわかりません。httpsを試すのは結構手間だし、パスはパーマリンク設定関連で本番で面倒なことになるかもしれないし。原因調査は諦めて、とりあえず何か認証情報を入れたらいけるだろうとやってみたら、いけました。

以下の様に、nonceを使用します。

```php
wp_create_nonce('wp_rest')
```

これをJavaScriptに渡して、以下の様にfetchします。

```javascript
fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce
    },
    body: JSON.stringify(items),
});
```

これでいけました。

## 余談

消費税、いまさらだけども、高くないですか？高すぎませんか。。。
