---
title: "【Laravel】ValetでローカルのhttpsテストをGCPリダイレクトに設定する"
pubDate: 2025-02-04
categories: ["Laravel"]
tags: []
---

https://www.masaakiota.net/2025/02/11/%e3%80%90laravel%e3%80%91caddy%e3%81%a7%e3%83%ad%e3%83%bc%e3%82%ab%e3%83%abhttps%e9%96%8b%e7%99%ba%e3%81%99%e3%82%8b/

こんにちは、フリーランスエンジニアのmohです。

## Valet

Valetは、Macで使える、テスト環境を簡単に構築できるツールです。Laravelのみでなく、WordPressでも使えるようです。

[https://laravel.com/docs/11.x/valet](https://laravel.com/docs/11.x/valet)

## 使ってみる

## インストール

まずbrewをアップデートしておきます。

```
brew update
```

composerでグローバルインストール

```
composer global require laravel/valet
```

続いてvaletのインストールコマンドを実行。ここでbrewが使われます。nginxやphpなど諸々がインストールされます。

```
valet install
```

phpはasdfで管理していたので、ここで新たにbrewでインストールされるのはちょっと残念でした。一応、valetはbrewのphpを使うそうです（GPT談）。ですので、まぁいいやの精神です。

## ディレクトリを設定

有効にしたいディレクトリに移動し、下記のコマンドを打ちます。

```
valet link xxx
```

すると、http://xxx.testでアクセスできるようになります。

httpsに対応するには、以下のようにします。

```
valet secure
```

これで、https対応です。すんばらしい。

## GCPのOAuthリダイレクトに使う

.testドメインは、GCPのリダイレクトに指定できません。GCPでは、トップレベルドメイン（TLD）を使う必要があります。一応localhostだけ使えるのですが、そうするとプロジェクトの区別にはポート番号しかありません。それはそれで面倒なので、工夫します。

valetはドメインを指定できます。ドメインの衝突を避けるため、できるだけマイナーなTLDを使用します。wtfやxyzなどがありますが、覚えやすいので今回はxyzを使用します。

またドメイン全体を、できるだけ被らないようにします。今回は、日付 + プロジェクト名 + xyzで攻めます。プロジェクト名をmy-catとし、URLをhttps://20250204.my-cat.xyzとします。

まずリンクします。

```
valet link 20250204.my-cat
```

ドメインをxyzにします。なおTDLを使用すると、他のサイト閲覧に影響が出るので注意してください。

```
valet domain xyz
```

警告が出るので、yで進みます。その後、https化します。

```
valet secure
```

これで、GCPのリダイレクトでも使用できるURLができました。

## Viteの開発でエラーになる

viteのbuild後は大丈夫ですが、開発時にエラーになります。この解決を下記で書きました。

https://www.masaakiota.net/2025/02/04/%e3%80%90laravel%e3%80%91valet-vite%e3%81%a7%e3%81%ae%e3%82%a8%e3%83%a9%e3%83%bc%e3%82%92%e8%a7%a3%e6%b6%88%e3%81%99%e3%82%8b/
