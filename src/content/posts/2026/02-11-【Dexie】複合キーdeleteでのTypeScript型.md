---
title: 【Dexie】複合キーdeleteでのTypeScript型
pubDate: 2026-02-11
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

今回はDexieでのdeleteメソッドにおける型についてです。

## Dexie

Dexieは、IndexedDBを簡単に使えるライブラリです。

https://dexie.org

今回下記のバージョンを使用しています

```
"dexie": "^4.3.0"
```

## 単一キーでの使用

単一キーでは、特に問題なく型をつけることができます。下記のようにします。型エラーもなく、意図通りに動作します。

```ts
type Item = {
  id: string;
};

const db = new Dexie("Items") as Dexie & {
  items: EntityTable<Item, "id">;
};
db.version(1).stores({
  items: "id",
});

// 更新
await db.items.put({ id: "abc" });
// データがある
console.log(await db.items.get("abc"));
// 削除
await db.items.delete("abc");
// データがない
console.log(await db.items.get("abc"));
```

## 複合キーでのdelete

一方複合キーでは、getは以下のように書けます。特に問題はありません。

```ts
await db.items.get(["abc", "def"])
```

同じくdeleteも書いてみます。

```ts
await db.items.delete(["abc", "def"]);
```

しかしこのdeleteは型エラーが出ます。

```
Argument of type 'string[]' is not assignable to parameter of type 'string'.
```

これはEntityTableが複合キーに対応しきれていないことが原因のようです。issueも立てられています。

https://github.com/dexie/Dexie.js/issues/1990

このissueは2024年のもので、今と挙動が違うようですが、いまだにopenであることから複合キーに対応していない事は変わり無いようです。

### anyで逃げる

この問題は、deleteにanyを使用する事で回避できます。根本的な解決ではありませんが、一旦これで逃げるのが良さそうです。

```ts
await db.items.delete(["abc", "def"] as any);
```

全体のコードは以下のようになります。

```ts
type CompositeItem = {
  id1: string;
  id2: string;
};

const db = new Dexie("CompositeItems") as Dexie & {
  items: EntityTable<CompositeItem, "id1" | "id2">;
};
db.version(1).stores({
  items: "[id1+id2]",
});

// 更新
await db.items.put({ id1: "abc", id2: "def" });
// データがある
console.log(await db.items.get(["abc", "def"]));
// 削除
await db.items.delete(["abc", "def"] as any);
// データがない
console.log(await db.items.get(["abc", "def"]));
```

## まとめ

Dexieは便利ですが、型が若干弱い点が気になります。もっともPrismaやDrizzleが強すぎるのかも知れません。型が複雑になるにつれ、人間が読むのが困難になってきますので、今後はこういう部分でAIが役立ってきそうですね。
