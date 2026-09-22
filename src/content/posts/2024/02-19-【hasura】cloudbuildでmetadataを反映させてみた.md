---
title: "【Hasura】CloudBuildでMetadataを反映させてみた"
pubDate: 2024-02-19
categories: ["Database"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## HasuraのMetadata

みんな大好きHasuraですが、Metadataの移行で色々つまづいたので書かせていただきます。Metadataは、DBと直接関係のないHasura特有の情報で、パーミッションなどが含まれています。

なお大まかな手順は以下になります。

*   ローカル環境でMetadataをダウンロード
*   MetadataをGithubにアップロード
*   CloudBuildで対象のHasuraに反映

一つ一つ見ていきます。

## Metadataをダウンロード

Metadataをダウンロードするには、まずcliを入れます。

```bash
yarn global add hasura-cli
```

初期化します。

```bash
hasura init
```

続いてMetadataをダウンロードします。exportを使います。

```bash
unset NODE_OPTIONS
hasura metadata export
```

ここでunset NODE\_OPTIONSとしているのは、エラー回避のためです。実行環境によるのかもしれませんが、少なくとも私の環境ではこのようにしないと、エラーで動きませんでした。

上記を実行すると複数のファイルが作成されるので、Githubにアップロードします。

## Cloud Buildで反映させる

続いてCloud Buildで反映させます。今回は以下のようにしました。

```yaml
# _HASURA_ENDPOINT: Endpoint of Hasura

steps:
  - name: 'node'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm install -g hasura-cli && \
        cd ./packages/hasura/cli && \
        hasura metadata apply --endpoint $_HASURA_ENDPOINT --admin-secret $$HASURA_ADMIN_SECRET
    secretEnv: ['HASURA_ADMIN_SECRET']
availableSecrets:
  secretManager:
  - versionName: projects/$PROJECT_ID/secrets/HASURA_ADMIN_SECRET/versions/latest
    env: 'HASURA_ADMIN_SECRET'
options:
    logging: CLOUD_LOGGING_ONLY
```

node環境でhasura-cliをインストールし、先ほどmetadataを作成したディレクトリまで移動。その後applyコマンドで実行しています。なおHASURA\_ADMIN\_SECRETはGCPのシークレットマネージャーを利用しています。

## 注意：DATABASE\_URLについて

HasuraのMetadataには、接続先のデータベース情報も含まれています。そのため以下の場合、泣きをみることになります。

\--- コンソールで直接DATABASE\_URLを指定している ---

この場合、そのURLがそのまま反映されてしまうため、ローカルで使用していたDBを参照しようとして接続できなくなります。そのため、ちゃんと環境変数から参照するように設定する必要があります。今回はこれで泣かされました。以上です。

## 小話

最近少し体調が良くなりました。少し睡眠時間を削っていけそうです。
