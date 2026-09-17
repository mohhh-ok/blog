---
title: "【HTML】Safariはvideoをキャッシュしない"
pubDate: 2024-12-19
categories: ["動画"]
tags: []
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## ブラウザのキャッシュ

通常、ブラウザは一度表示したコンテンツをキャッシュし、次回表示時に再利用します。

その動作をコントロールするために、以下のようなヘッダーが使用されます。

```
Cache-Control: max-age=604800, public
```

## Chromeでの動作

上記ヘッダーを付与したmp4ファイルに対して、Chormeはキャッシュを使用し、次回表示はスムーズに行われました。

## Safariでの動作

Chrome同様のヘッダーで同じファイルを読み込みましたが、読み込むたびにSafariはネットワークからダウンロードを行いました。さらにダウンロードが終わるまでビデオは動かず、現在何が起こっているのかさっぱりわからない状態です。インスペクタでかろうじて、読み込み中のバイト数を眺めて、ダウンロードが行われているのを知ることができるといった状態です。

## 対策

### fetchする

JavaScriptでfetchして、メモリ上に保持する方法です。以下で解説されています。ただしファイルサイズの小さな動画に限られます。

https://stackoverflow.com/questions/55923054/safari-not-retrieving-mp4-video-from-cache-and-sometimes-timeout-when-downloadi

### IndexedDBに保存する

IndexedDBに保存して、再利用することもできます。IndexedDBを利用するには、Dexieなどのライブラリが便利です。
