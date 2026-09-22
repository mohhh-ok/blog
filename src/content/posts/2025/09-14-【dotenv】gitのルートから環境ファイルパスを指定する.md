---
title: "【dotenv】gitのルートから環境ファイルパスを指定する"
pubDate: 2025-09-14
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## dotenv cli

dotenv cliでは、環境変数ファイルを指定して任意のスクリプトを実行できます。

```
dotenv -e ./.env -- dosomething
```

親を遡ることも可能です。

```
dotenv -e ../../../../../../.env -- dosomething
```

しかし階層が深くなると、どこに目的のファイルがあるかわかりにくく、地味に泣きたくなってしまいます。

## gitのルートを指定する

gitのルートを取得するコマンドがあります。

```
git rev-parse --show-toplevel
```

これを実行すると、gitのルートディレクトリの絶対パスが出力されます。

これを利用すると、たとえばgitルートの.envを取得したい場合

```
dotenv -e "$(git rev-parse --show-toplevel)/.env" -- dosomething
```

となります。超便利ですね。
