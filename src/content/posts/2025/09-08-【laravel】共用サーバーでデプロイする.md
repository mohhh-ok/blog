---
title: "【Laravel】共用サーバーでデプロイする"
pubDate: 2025-09-08
categories: ["Laravel"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Laravel + 共用サーバー

LaravelはPHPのため、共用サーバーで使えます。しかし下記のような問題があります。

*   composer実行ファイルが無い、あるいは古い
*   phpが古い
*   ルートがpublic\_html固定

ひとつひとつ見ていきます。

## composerを新しく入れる

大抵の共用サーバーでは、composerが無いかあるいは古いバージョンのままになっています。共用サーバーでの権限による制限回避のため、ユーザーディレクトリ内で解決する必要があります。

```
cd ~
mkdir bin
```

このようにユーザーディレクトリに専用のbinディレクトリを作成し、そこに実行ファイルをおく形となります。手順は以下です。

*   composerの公式サイトに従ってインストール
*   生成されたcomposer.pharをbin/composerにリネーム (mv composer.phar ~/bin/composer)
*   bin/composerを実行可能にする (chmod +x ~/bin/composer)
*   $HOME/binにPATHを通す

## phpを新しく入れる

phpが古かったりもします。最近のレンタルサーバーでは、提供されているコントロールパネル上でwebで使用するphpを指定したりもできますが、cliの指定は大抵できません。cliで使用するphpを指定するには、そのバージョンのphpパスと~/bin/phpでシンボリックリンクを貼ります。

```
ln -s [使うphpのパス] ~/bin/php
```

## ドキュメントルートを解決する

共用サーバーによってはドキュメントルートがpublic\_html固定となっており、laravelのpublicディレクトリを指定できなかったりします。解決は下記の方法があります。

*   選択肢1: public\_html以下にlaravelディレクトリを作成し、.htaccessでリライトする
*   選択肢2: public\_htmlの他で専用のディレクトリを作成し、.htaccessでリライトする

選択肢１だと以下のようになります。

```
public_html
  - .htaccess
  - laravel
    - public
    - .env
    - ...
```

public\_html/.htaccessは下記のようにして、laravel/publicに流すようにします。

```
RewriteEngine On

RewriteRule ^(.*)$ laravel/public/$1 [L]
```

これで、laravelのrouteで指定しているパスは正常にルーティングされるようになります。またURLから/laravel/.envにアクセスしても404が出るため安全です。

## Cronを設定する

Cronでは.bashrcのような初期化が効かないため、phpはフルパスで指定する必要があります。

```
[path to php] artisan xxx
```
