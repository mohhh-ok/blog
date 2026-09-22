---
title: "【Laravel11】AdminerでSQLiteを操作する"
pubDate: 2024-12-28
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## LaravelのAdminer

LaravelでAdminerを使うには、以下のライブラリを使用します。

https://github.com/senaranya/laravel-adminer

## 問題

SQLiteは、普通に使うことができません。Adminerは現在、すべてのdbでパスワードを要求します。しかしSQLiteはパスワードレスのため、エラーになって使えません。

そのためAdminerの提供するプラグイン（後述）を、laravel-adminerに統合する必要があります。

## 手順

composerではインストールしません。

リポジトリから直接ファイルをダウンロードし、適切な場所に設置します。今回は、ルートに設置しました。

```
/aranyasen/laravel-adminer
```

以下のファイルを保存します。Adminerのサイトで紹介されているプラグインです。パスワードは要求するが、dbには渡さないようにするそうです。

[https://raw.githubusercontent.com/vrana/adminer/master/plugins/login-password-less.php](https://raw.githubusercontent.com/vrana/adminer/master/plugins/login-password-less.php)

保存先は以下のようにします。

```
/aranyasen/laravel-adminer/src/plugins/AdminerLoginPasswordLess.php
```

プラグインを追加します。/aranyasen/laravel-adminer/src/plugins/adminer-with-plugins.phpに追記します。

```php
$plugins = [
    ... // 他のプラグイン
    new AdminerLoginPasswordLess(password_hash('password', PASSWORD_DEFAULT)),
];
```

あとはroutes/web.phpを以下のようにします。

```php
use Illuminate\Support\Facades\Config;

Route::any('/adminer', function () {
    if (! isset($_GET['db'])) {
        $databaseConnection = Config::get('database.default');

        $databaseDriver = Config::get("database.connections.$databaseConnection.driver");
        if ($databaseDriver === "mysql") {
            $databaseDriver = "server";
        }

        $_POST['auth']['driver'] = $databaseDriver;
        $_POST['auth']['server'] = Config::get("database.connections.$databaseConnection.host") . ':' .
            Config::get("database.connections.$databaseConnection.port");
        $_POST['auth']['db'] = Config::get("database.connections.$databaseConnection.database");
        $_POST['auth']['username'] = Config::get("database.connections.$databaseConnection.username");
        $_POST['auth']['password'] = Config::get("database.connections.$databaseConnection.password");
    }
    require base_path('aranyasen/laravel-adminer/src/adminer-with-plugins.php');
})->withoutMiddleware(VerifyCsrfToken::class);
```

これで、/adminerにアクセスすれば使えるようになります。パスワードには「password」を入力してください。

なおセキュリティのため、上記ルートは適切なアクセス制限をかけることをお勧めします。
