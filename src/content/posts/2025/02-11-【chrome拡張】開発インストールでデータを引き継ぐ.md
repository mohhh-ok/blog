---
title: "【Chrome拡張】開発インストールでデータを引き継ぐ"
pubDate: 2025-02-11
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Chromeのstorage

Chrome拡張機能では、storageを使うことができます。これはExtension IDに紐づいているようです。そのため、再インストールした時に消えてしまいます。

IDを指定する必要があるのですが、これはカギ生成で行われます。

```
chrome --pack-extension
```

上記を実行すると、xxx.crxファイルとxxx.pemファイルが生成されます。このcrxファイルは、Chromeに直接インストールすることはできなくなっています。crxファイルをインストールするためには、Chrome web storeに登録する必要があります。今回は、crxは無視します。

必要なのは.pemファイルです。

```
-----BEGIN PRIVATE KEY-----
...
...
...
-----END PRIVATE KEY-----

```

この、BEGINからENDに挟まれた部分をコピーします。改行は削除して、１行にまとめます。

manifest.jsonのキーに入れます。

```
{
  "key": "..."
```

これで、Extensionのキーを指定できました。あとは拡張機能を修正したら、インストールした時と同様に、「パッケージ化されていない拡張機能を読み込む」で読み込めば上書きされます。
