---
title: "【TypeScript】知っていると便利な型定義"
pubDate: 2024-02-08
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

TypeScriptは型定義で出来ることがたくさんあり覚え切れないので、知っていると役立ちそうなものをピックアップしていこうと思います。このページは随時更新しています。

## オブジェクトから作成する

通常は先にTypeを作りますが、オブジェクトからTypeを生成することもできます。

```typescript
const obj = { a: 1, b: 2, c: 3 };
type Type = typeof obj;
const a: Type = { a: 1, b: 2, c: 3 }; // ok
const b: Type = { a: 1 }; // error
const c: Type = { d: 1 }; // error
```

キーを抽出もできます。

```typescript
const obj = { a: 1, b: 2, c: 3 };
type Type = keyof typeof obj;
const a: Type = 'a'; // ok
const b: Type = 'd'; // error
```

バリューは以下のように抽出できます。

```typescript
const obj = { a: 1, b: 2, c: 3 } as const;
type Type = typeof obj[keyof typeof obj];
const a: Type = 1; // ok
const b: Type = 4; // error
```

## 配列から作成する

以下のようにすれば、配列から型も生成できます。

```typescript
const keys = ['a', 'b', 'c'] as const;
type Type = (typeof keys)[number]; // 'a' | 'b' | 'c'
const a: Type = 'a'; // ok
const d: Type = 'd'; // error
```

リストをコンパイル後に参照したい時に便利ですね。

以下では、配列を使用した使用を理解するために、順番に書いてみました。

```typescript
function returnGivenArg<T>(arg: T): T {
    return arg;
}

function returnGivenArray<T extends any[]>(arr: T): T {
    return arr;
}

function returnGivenArrayReadOnly<T extends readonly any[]>(arr: T): T {
    return arr;
}

function returnOneOfGivenArrayReadOnly<T extends readonly string[]>(arr: T): T[number] {
    return arr[0];
}

// "aaa"
const arg = returnGivenArg('aaa');

// string[]
const array = returnGivenArray(['a', 'b', 'c']);

// ["a", "b", "c"]
const arrayReadOnly = returnGivenArrayReadOnly(['a', 'b', 'c'] as const);

// "a" | "b" | "c"
const oneOfArrayReadOnly = returnOneOfGivenArrayReadOnly(['a', 'b', 'c'] as const);

const abcReadOnly = ['a', 'b', 'c'] as const;

// "a" | "b" | "c"
const oneOfArrayReadOnlyWithGeneric = returnOneOfGivenArrayReadOnly<typeof abcReadOnly>([] as any);
```

as constを使用してreadonlyにすることで、使い道は広がりますね。readonlyにした配列を、ジェネリックに渡せるのも良いです。

以下のようにすれば、キーを渡すだけで型が確定します。

```typescript
const obj = {key1: 'a', key2: 'b'} as const;

function returnValueOfObjByKey<K extends keyof typeof obj>(key: K): (typeof obj)[K] {
    return obj[key];
}

// "a"
const d = returnValueOfObjByKey('key1');
```

## 小話

最近コーヒーにハマってます。子供の頃は嫌いだったのですが。今は酒もコーヒーも美味しくて、大人になるってのは、どういうことなんでしょうね。
