---
title: "【TypeScript】Dexieで型安全にIndexedDBを操作する"
pubDate: 2024-12-19
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## IndexedDB

IndexedDBは、現在のすべてのブラウザでサポートされているストレージ機能です。cookie,localStrageなどで収まらない大きなサイズのデータを扱う場合に使用します。

ただ最近の書き方にはあまり対応していません。標準ではawaitも使えませんし、自分でラッパーを描く羽目になったりします。またオブジェクト型の安全性もありません。

## Dexie

Dexieを使えば、オブジェクト型の安全性も確保されます。

```typescript
import Dexie, { type EntityTable } from 'dexie';

interface Friend {
    id: number;
    name: string;
    age: number;
}


export class Database extends Dexie {
    friends!: Table<Friend>;

    constructor() {
        super('FriendsDatabase');
        this.version(1).stores({
            friends: '++id, age',
        });
    }
}

const db = new Database();

db.friends.add({
    name:'John',
    age:20,
});

```

これは便利ですね。sotresに指定したフィールド全てにインデックスが貼られるようです。先頭がプライマリーになります。

++

オートインクリメントな主キー

&

ユニークキー

\*

複数可(array)

\[A+B\]

複合index

インデックスを貼りたくない場合は、storesに含めずに使用すれば良いようです。
