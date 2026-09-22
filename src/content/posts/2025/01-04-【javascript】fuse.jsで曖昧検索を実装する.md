---
title: "【JavaScript】Fuse.jsで曖昧検索を実装する"
pubDate: 2025-01-04
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 曖昧検索事情

昨今のAIの発達により、ユーザーは曖昧検索が当たり前という意識にシフトしつつあると思います。曖昧検索は、今後のデフォルトになるかもしれません。

## JavaScriptで実装

今のところ、簡単に実装するにはFuse.jsを使用すると良さそうです。少ない件数なら、必要なデータをフロントに持ってきて、そこで処理できそうです。

```
npm i fuse.js
```

```javascript
import Fuse from 'fuse.js';

const data = [
    { name: 'ディー・エヌ・エー' },
    { name: 'ディーエヌアエー' },
    { name: 'ディーエヌエー' },
    { name: 'DNA' },
];
const fuse = new Fuse(data, { keys: ['name'], threshold: 1.0 });
console.log(fuse.search('ディーエヌエー')); // 曖昧一致した結果を返す

// 結果
// [
//   { item: { name: 'ディーエヌエー' }, refIndex: 2 },
//   { item: { name: 'ディーエヌアエー' }, refIndex: 1 },
//   { item: { name: 'ディー・エヌ・エー' }, refIndex: 0 }
// ]
```

データが膨大だと、もっとしっかりしたのを組まないといけなくなるかと思いますが、ひとまずといった使い方ですね。
