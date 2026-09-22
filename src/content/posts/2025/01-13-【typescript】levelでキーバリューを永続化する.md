---
title: "【TypeScript】levelでキーバリューを永続化する"
pubDate: 2025-01-13
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## level

[https://www.npmjs.com/package/level](https://www.npmjs.com/package/level)

levelは、LevelDBと呼ばれるプログラムのJavaScript版です。LevelDBはGoogle関係者が、IndexedDB開発のために作り出したそうです。JavaScript版にはNode.js版とブラウザ版があり、その抽象クラスがlevelだとのことです。

## 使ってみる

普通に使えば、単なる文字列を格納します。ただし今回は、Data型を定義して使ってみます。

まずインスタンスを作成します。valueEncodingをjsonにします。

```typescript
interface Data {
  name: string;
  age: number;
}

const db = new Level<string, Data>('example', { valueEncoding: 'json' });
```

この場合exampleディレクトリが生成され、そこに何やら怪しげなファイルが複数生成されます。単一ファイルでない所が、若干扱いにくそうです。ただしコード自体は非常にシンプルで使いやすいです。

```typescript
// 1つだけ追加
await db.put('person1', { name: 'John', age: 30 });

// 複数追加
await db.batch([
  { type: 'put', key: 'person2', value: { name: 'Jane', age: 25 } },
]);

// 取得
const value = await db.get('person1');
console.log('get one', value);

// 複数取得
for await (const [key, value] of db.iterator()) {
  console.log('get many', { key, value });
}

// 結果
// get one { name: 'John', age: 30 }
// get many { key: 'person1', value: { name: 'John', age: 30 } }
// get many { key: 'person2', value: { name: 'Jane', age: 25 } }
```

iteratorは、キーを対象に色々オプションがあるようですので、好きなデータを取得できそうです。
