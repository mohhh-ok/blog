---
title: "【Hasura】hasura consoleでmigrationファイルが更新されない件"
pubDate: 2024-04-02
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## hasura console

hasura cliを用いて以下のコマンドを実行すると、http://localhost:9695/consoleが立ち上がります。

```
hasura console
```

ここでテーブルなどを更新すると、migrationファイルが更新されるとのことです。なるほどそうかそうかと何度やっても更新されないので、途方に暮れていました。この原因が分かりましたので、共有させていただきます。

## dokcer-compose.ymlと同じディレクトリで実行する必要がある

公式サイトを何度読んでもわからなかったのですが、ふとたどり着いたサイトでこのような記述を見つけました。つまり、以下の構成になります。

```
-- hasura
   -- docker-compose.yaml
   -- config.yaml
```

ここでhasura consoleを実行すると、無事テーブル変更がmigrationファイルに反映されるようになりました。なおdockerで起動している場合です。

## 余談

お腹が空いて仕方がないので、何か食べようと思います。こどおじの私は、母の作ってくれるカレーが命綱です。
