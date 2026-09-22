---
title: "【JavaScript】ESM, CommonJSの互換性を考えてみる"
pubDate: 2024-11-20
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

まだまだ分かっていませんが、NPMライブラリを公開するようになって色々いじっていることから、ESM, CommonJSの関係について考えてみたいと思います。

## ESM, CommonJS概要

ざっくりいえば、以下のような具合です。

*   ESM: 新しい
*   CommonJS: 古い

上記から、できれば新しい技術を使った方が良いといった観点から、ESMを選択したくなります。たとえばESMはトップレベルでのawait実行ができたり便利です。

## 互換性

しかし互換性の問題があります。読み込む際は、以下のようになります。

*   ESMからCommonJSを読み込む => OK
*   CommonJSからESMを読み込む => NG

このことから、ESM俺強いといった具合に、とにかくESMを選択していれば問題はなさそうに思えます。しかしライブラリとして公開するなら、互換性を考慮してできるだけCommonJSにしたいという葛藤もあります。腰の低い人は多くの人に慕われたりしますよね。

そのためできるだけCommonJSで開発し、使用するライブラリにESMが現れたら、自分もESMにするといった方向性がいいのではないかと思います。

## フロント開発との関係

フロント開発では、ほとんどがESMのようです。そのため、フロント開発はESMでないと使用ライブラリがかなり限定されそうです。そのため、フロントはESMが妥当かと思います。逆に、バックエンドはできるだけCommonJSで開発すると、将来的な互換性のあるライブラリ開発などを考慮した際に良さそうです。

### MUI

ちなみにMUI Iconsでは、以下のようになります。

```javascript
// moduleだと使えない
import EditIcon from "@mui/icons-material/Edit";

// moduleの場合、以下のようにする必要がある
import { EditIcon } from "@mui/icons-material";
```

このことから、moduleの場合、バンドルサイズが大きくなる懸念がありました。しかし今試してみると、moduleで名前付きexportを利用しても、バンドルサイズは特に大きくなることはありませんでした。どうやら最新のMUIでは、バンドルサイズ肥大の問題は解決されているようです。知らなかった。。。

どうやらフロントの場合、安心してmoduleで開発して良さそうです。

## moduleResolution

tsconfig.jsonでは、moduleタイプと、moduleResolutionを選択できます。こちら２つありますが、実際はパターンがあるため１つの設定を２箇所に書くといった感じかと思います。以下は例です。

```javascript
// ESNextペア
"module": "ESNext",
"moduleResolution": "bundler",

// NodeNextペア
"module": "NodeNext",
"moduleResolution": "nodenext",

// CommonJSペア
"module": "CommonJS",
"moduleResolution": "node",
```

ESMの場合、ESNextペアか、NodeNextペアかどちらかになるかと。この違いは以下になります。

*   ESNextペア: ESMのみ。フロントならとりあえずこれを選択しておけば良さそう。
*   NodeNextペア: ESMあるいはCommonJS。package.jsonのtype設定によって変わる。import時に.jsを付与しないといけないなど多少面倒。

といった具合です。
