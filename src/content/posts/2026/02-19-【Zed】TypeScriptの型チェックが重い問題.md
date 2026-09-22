---
title: 【Zed】TypeScriptの型チェックが重い問題
pubDate: 2026-02-19
categories: ["開発"]
---

こんにちは、フリーランスエンジニアのmohです。

## Zed

ZedはVSCodeの次に来るであろうIDEです。AIコーディングで有名なCursorはVSCodeベースで重いですが、Zedはメモリ消費量が少なく済みます。AI機能も搭載されています。

https://zed.dev/

## TypeScriptの型チェックが重い問題

Zed自体の問題かわかりませんが、TypeScriptの型チェックが重いともっぱらの評判です。

下記で議論されています。

https://github.com/zed-industries/zed/issues/18698

## tsgoでちょっと軽くなる

TypeScriptの型チェックにはLSPが用いられますが、現在Zedはvtslsが標準で用いられています。tsgoを使用すると少し軽くなりました。tsgoを使用するには、以下の手順を行います。

- tsgo拡張機能をインストール
- tsgo拡張機能を有効化

有効化するには、settings.jsonを下記のようにします。

```json
{
  "lsp": {
    "tsgo": {}
  }
}
```

```json
"languages": {
  "TypeScript": {
    "language_servers": ["tsgo", "vtsls"]
  },
  "TSX": {
    "language_servers": ["tsgo", "vtsls"]
  },
}
```

なおvtslsと複数指定していますが、これは公式で以下のように説明されています。

> You can also use tsgo in tandem with other language servers (e.g. typescript-language-server or vtsls). Zed will use tsgo for features it supports and fallback to the next language server in the list for unsupported features. To do that with vtsls

複数サーバー結果が候補として出るのが煩わしい場合は、以下のようにします。

```json
"languages": {
  "TypeScript": {
    "language_servers": ["tsgo"]
  },
  "TSX": {
    "language_servers": ["tsgo"]
  },
```
