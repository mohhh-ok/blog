---
title: "【TypeScript】有効にすべきオプションまとめ"
pubDate: 2025-07-05
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## TypeScriptのオプション

TypeScriptでは、tsconfig.jsonで様々なオプションを指定できます。中には互換性を重視して、デフォルトでは無効になっているものの、有効にすべきものもあります。今回は、そうした有効にすべきオプションです。

## noImplicit系

noImplicit系は下記があります。

*   noImplicitAny
*   noImplicitReturns
*   noImplicitThis
*   noImplicitOverride

暗黙の定義を許可しないようにできます。基本的に、noImplicit系はすべてtrueにするのが良いかと思います。

### noImplicitAny

noImplicitAnyは、暗黙anyを許可しないようにします。strict: trueで自動的にtrueになります。逆に言えば、strict: trueでも、noImplicitAnyがfalseの場合は動作しません。

下記はxが暗黙anyで危険なため、検出されます。

```typescript
function f(x) {
  console.log(x.trim());
}
```

### noImplicitReturns

関数内の条件分岐で、すべてのパターンで値を返しているかがチェックされます（厳密には意味合いは違うかもしれませんが）。

例えば以下のようなコードの場合

```typescript
function f(n: number) {
  if (n === 1) return 'a';
}
```

すべてのパターンでstringを返すのが、よくある実装かと思います。しかしn===1しか実装されていません。noImplicitReturns: trueの場合、こうしたケアレスミスを検出してくれます。

### noImplicitThis

暗黙thisを検出してくれます。最近ではthisを使う機会が少なくなってきている（関数型への移行など）ので、あまり恩恵はないかもしれませんが、とりあえずtrueにしておくと良さそうです。バインド忘れなどは、ふとした時に起きそうですので、そうした場合に安心です。

### noImplicitOverride

クラスでの暗黙overrideを検出してくれます。overrideかどうかをはっきりさせることで、基底クラスの変更に伴う予期せぬバグなどの防止につながります。

## その他の重要なオプション

### noUncheckedIndexedAccess

noUncheckedIndexedAccessは、配列やオブジェクトでundefinedの可能性を入れるかどうかを指定します。これはぜひtrueにすべきプロパティです。

noUncheckedIndexedAccess: falseの場合、

```typescript
const strings = ['a', 'b', 'c'];
const s = strings[5]; // sは string になる
console.log(s.trim()); // 通ってしまう

const obj = { a: 1, b: 2, c: 3 } as Record<string, number>;
const value = obj['d']; // valueは number になる
console.log(value.toFixed(2)); // 通ってしまう
```

このように、何でもかんでもあたいが存在する扱いとなってしまいます。これでは事前にエラーを検出することが難しくなります。

そのため、noUncheckedIndexedAccessをtrueにします。するとundefinedとのユニオンタイプとなり、エラーを検出できます。

```typescript
const strings = ['a', 'b', 'c'];
const s = strings[5]; // sは string | undefined になる
console.log(s.trim()); // エラーになる

const obj = { a: 1, b: 2, c: 3 } as Record<string, number>;
const value = obj['d']; // valueは number | undefined になる
console.log(value.toFixed(2)); // エラーになる
```

### noFallthroughCasesInSwitch

noFallthroughCasesInSwitchは、switch構文のケアレスミスをチェックしてくれます。具体的には、break無しを許容しないようになります。

下記のような、危ういコードも検出してくれるようになります。

```typescript
let n = 0;
switch (n) {
  case 0:
    console.log(0);
  case 1:
    console.log(1);
}
```

n===0の場合、0を出力した後に1も出力されてしまいます。こうしたケアレスミスが炙り出されます。

## まとめ

今回あげたオプションは以下となります。

```typescript
{
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
}
```

これを常に入れておくと、よりTypeScriptの恩恵が受けられるかと思います。
