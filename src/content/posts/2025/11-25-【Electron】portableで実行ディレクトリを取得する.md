---
title: 【Electron】portableで実行ディレクトリを取得する
pubDate: 2025-11-25
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

## Electronのportableビルド

Electronではportableビルドができます。主な違いは以下のようなモノです。

- nsis: インストーラ形式
- zip: zip形式。解凍すると中に煩雑なファイルが含まれる
- portable: 実行時に一時ディレクトリに解凍される。配布ファイルがシンプルになる

portableビルドはインストール不要で実行できるため、USBメモリなどで持ち運んで使用する場合に便利です。


## 設定方法

portableビルドを使用するには、以下のような設定を使います。


```ts
import { Configuration } from "electron-builder";

const config: Configuration = {
  ...
  win: {
    ...
    target: ["portable"],
  },
  portable: {
    artifactName: "${name}-${version}-portable.${ext}",
  },
};

export default config;
```

## パスの問題

portableでビルドした場合、例えばexeの場所を取得しようとすると一時ディレクトリの場所が返ってきます。

```ts
app.getPath('exe') // C:\Users\xxx\AppData\Local\Temp\yyy
```

このためデータ保存などは工夫が必要となります。

## 環境変数を参照する

環境変数に、配布ファイル場所が格納されています。

- PORTABLE_EXECUTABLE_APP_FILENAME: 配布ファイルの名前
- PORTABLE_EXECUTABLE_DIR: 配布ファイルの格納ディレクトリ
- PORTABLE_EXECUTABLE_FILE: 配布ファイルのフルパス

これを使えば、たとえばexeの配下にデータを置くなど、意図した設計が可能となります。
