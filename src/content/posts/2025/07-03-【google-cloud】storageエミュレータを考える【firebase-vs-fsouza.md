---
title: "【Google Cloud】Storageエミュレータを考える【firebase vs fsouza】"
pubDate: 2025-07-03
categories: ["Google Cloud"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## エミュレータの必要性

開発で最も大切なのが、快適なテスト環境かと思います。テスト環境がないと、本番=>エラー=>どこを修正すればいいかわからない といったケースが頻発します。できるだけ細分化したテストができる環境構築は必須です。

## Cloud Storageのエミュレータ

Cloud Storageのエミュレータは、以下のようなものがあります。

*   Firebase emulator
*   fsouza/fake-gcs-server

### Firebase emulator

Firebase emulatorは複数サービスのエミュレータが使えます。そのうちの一つに、Storageがあります。これはfirebaseクライアントからでも、@google-cloud/storageクライアントからでも、どちらからもアクセス可能です。

```bash
pnpm i -D firebase-tools

pnpm firebase init
# StorageとEmulatorsを選択
# => Don't set up a default project
# => Storage emulator
```

rulesファイルを下記のように書き換えます。

```
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // if falseから変更
    }
  }
}
```

クライアントは、firebase, google, どちらも使用可能です。

```bash
# どちらかを使用
pnpm i firebase
pnpm i @google-cloud/storage
```

起動します。

```bash
pnpm firebase emulators:start
```

データを永続化するには、下記のようにします。

```bash
pnpm firebase emulators:strat --import .firebase-data --export-on-exit
```

### fsouza/fake-gcs-server

Dockerで使えるのが魅力です。永続化も簡単にできます。

```docker
  gcs:
    image: fsouza/fake-gcs-server
    restart: unless-stopped
    ports:
      - 4443:4443
    volumes:
      - ./docker/gcs/data/public:/data/public
      - ./docker/gcs/data/private:/data/private
      - ./docker/gcs/storage:/storage
    command: -scheme http -public-host localhost:4443
```

## 署名付きURL

署名付きURLは、どちらのエミュレータでも使えません。そのため、開発環境ではロジックを分岐させる必要があります。今回調査した動機でもあるのですが、結局どちらもダメでした。残念。

## 永続化

データの永続化は、快適なテストのために必要です。今回の２つは、どちらも永続化が可能です。

## まとめ

今回、Firebase emulatorと、fsouza/fake-gcs-serverの比較をしてみました。Firebaseの他のサービスも複合で使う場合は、Firebaseを選ぶといいかと思います。ですがGCSのみとなると、簡単にセットアップできるfsouza/fake-gcs-serverもいいかと。
