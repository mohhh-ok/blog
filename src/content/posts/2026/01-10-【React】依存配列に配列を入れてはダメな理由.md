---
title: 【React】依存配列に配列やオブジェクトを入れてはダメな理由【Maximum update depth exceeded】
pubDate: 2026-01-10
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## Reactの依存配列

Reactは状態管理がとても優れています。それを支えている一つが依存配列です。

以下は正常なコードです。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);

  useEffect(() => {
    setDummy(d => d + 1); // useEffect内で状態更新
  }, [1]); // 依存配列に固定値1を入れている

  return dummy;
}
```

`1`は固定値で変化しないため、比較関数は`1===1`で常にtrueとなり、useEffect内の関数は１度だけ呼ばれます。

### 依存配列に配列を入れる

続いて依存配列に配列を入れてみます。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);

  useEffect(() => {
    setDummy(d => d + 1);
  }, [[1]]); // 依存配列に固定配列を入れている

  return dummy;
}
```

すると以下のエラーになります。

```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

これは依存配列に配列を入れたことで、`[1]===[1]`が常にfalseとなり、useEffect内の関数が無限ループしてしまうためです。

### 依存配列にオブジェクトを入れる

同様に、オブジェクトを入れても同じ結果となります。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);

  useEffect(() => {
    setDummy(d => d + 1);
  }, [{ a: 1 }]); // 依存配列にオブジェクトを入れている

  return dummy;
}
```

これは依存配列にオブジェクトを入れたことで、`{a:1}==={a:1}`が常にfalseとなるためです。

## なぜ配列やオブジェクトは比較できないのか

JavaScriptには**プリミティブ型**と**参照型**という2つのデータ型があります。

### プリミティブ型

プリミティブ型（number, string, boolean等）は値そのものが比較されます。

```tsx
1 === 1 // true
"hello" === "hello" // true
true === true // true
```

### 参照型

一方、参照型（配列、オブジェクト）はメモリ上の参照（アドレス）が比較されます。

```tsx
[1] === [1] // false（異なるメモリアドレス）
{ a: 1 } === { a: 1 } // false（異なるメモリアドレス）

// 同じ参照を指す場合のみtrue
const arr = [1];
arr === arr // true
```

レンダリングのたびに新しい配列やオブジェクトが生成されるため、Reactの依存配列の比較では常に「変更があった」と判断されてしまいます。

## 解決策

### 1. useMemoを使用する

配列やオブジェクトをメモ化することで、参照を保持できます。

```tsx
import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);
  
  const deps = useMemo(() => [1], []); // メモ化された配列

  useEffect(() => {
    setDummy(d => d + 1);
  }, [deps]); // 参照が保持されるため、1度だけ実行される

  return dummy;
}
```

### 2. 配列の要素を個別に指定する

配列の各要素をプリミティブ型として依存配列に入れます。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);
  const arr = [1, 2, 3];

  useEffect(() => {
    setDummy(d => d + 1);
  }, [arr[0], arr[1], arr[2]]); // 配列の要素を展開

  return dummy;
}
```

### 3. スプレッド構文で展開する

配列をスプレッド構文で展開して依存配列に渡すことで、各要素がプリミティブ型として扱われます。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);
  const arr = [1, 2, 3];

  useEffect(() => {
    setDummy(d => d + 1);
  }, [...arr]); // スプレッド構文で展開

  return dummy;
}
```

### 4. JSON.stringifyを使用する（非推奨）

オブジェクトを文字列化して比較する方法もありますが、パフォーマンス上の理由から推奨されません。

```tsx
import { useEffect, useState } from "react";

export default function App() {
  const [dummy, setDummy] = useState(0);
  const obj = { a: 1, b: 2 };

  useEffect(() => {
    setDummy(d => d + 1);
  }, [JSON.stringify(obj)]); // 文字列化して比較

  return dummy;
}
```

## まとめ

- 依存配列には**プリミティブ型**を入れるのが基本
- 配列やオブジェクトは参照型のため、比較時に常に異なると判断される
- 解決策として`useMemo`の使用、要素の展開、スプレッド構文による展開が推奨される

Reactの依存配列を正しく理解することで、パフォーマンスの良いアプリケーションを構築できます。
