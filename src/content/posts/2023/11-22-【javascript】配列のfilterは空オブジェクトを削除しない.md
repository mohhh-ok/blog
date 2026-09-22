---
title: "【JavaScript】配列のfilterは空オブジェクトを削除しない"
pubDate: 2023-11-22
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## JavaScript 空オブジェクトは真になる

JavaScriptは以下のような空オブジェクトを、真として扱います。

```javascript
const blank = {};
console.log( blank ? "true" : "false" ); // true

// ちなみに他の場合
console.log( 1 ? "true" : "false" ); // true
console.log( 0 ? "true" : "false" ); // false
console.log( "" ? "true" : "false" ); // false
```

## filterをかけても、真なので消えない

前述のこともあり、filterでそのまましても消えません。

```javascript
const arr = [{}, 1, 0];
console.log(arr.filter(a=>a)); // [{}, 1];
```

## キー判定を入れる

そこでキー判定を入れてみます。

```javascript
const arr = [{}, 1, 0];
console.log(
  arr.filter(a => Object.keys(a).length > 0)
); // []
```

全部消えてしまいましたが、これはオブジェクト以外のキーが0個のためです。

何はともあれ、用途によってはこうした方法も使えそうですね。

## 小話

家の近くで工事をやっているのですが、家が若干揺れてインターネットが繋がらなくなるということがありました。いやいや、どれだけ弱いねんうちのインターネットは。

ではでは。
