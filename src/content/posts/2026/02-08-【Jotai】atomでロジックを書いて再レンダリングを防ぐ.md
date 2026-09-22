---
title: 【Jotai】atomでロジックを書いて再レンダリングを防ぐ
pubDate: 2026-02-08
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## Jotai

Jotaiは日本の方が作られたReactの状態管理ライブラリです。

https://jotai.org/

とてもシンプルなのに関わらず、いまだに全てを使いこなせていませんが、その便利な機能のひとつを今回ご紹介させていただきます。

## 通常の使い方

通常は以下のようにして使うかと思います。シンプルなCount Upです。

```tsx
import { atom, useAtomValue, useSetAtom } from "jotai";

const countAtom = atom<number>(0);

export default function App() {
  // 一度だけ呼ばれる
  console.log("render App");
  return (
    <div>
      <Count />
      <CountUpButton />
    </div>
  );
}

function Count() {
  // Count Upごとに呼ばれる
  console.log("render Count");
  const count = useAtomValue(countAtom);
  return count;
}

function CountUpButton() {
  // 一度だけ呼ばれる
  console.log("render CountUpButton");
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>Count Up</button>;
}
```

## 副作用を伴う使用

続けて、このcountをログするだけのロジックを書いてみます。

### Jotaiを活かさない書き方

通常のフックを使うとJotaiの良さが生きてきません。以下の例では、フックを読み込むコンポーネントで不要な再レンダリングが発生しています。

```tsx
import { atom, useAtomValue, useSetAtom } from "jotai";

const countAtom = atom<number>(0);

// countをログするフック
function useLogCount() {
  // ここでcountを参照している
  const count = useAtomValue(countAtom);
  const logCount = () => console.log(count);
  return { logCount };
}

export default function App() {
  const setCount = useSetAtom(countAtom);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count Up</button>
      <LogCountButton />
    </div>
  );
}

function LogCountButton() {
  const { logCount } = useLogCount();

  // count更新時に、本来不要な再レンダリングが起きる
  console.log("render LogCountButton");

  return (
    <button onClick={() => logCount()}>
      Log Count
    </button>
  );
}
```

### Jotaiを活かした書き方

以下のようにjotaiでロジックを書くと、不要な再レンダリングを防ぐことができます。

```tsx
import { atom, useAtomValue, useSetAtom } from "jotai";

const countAtom = atom<number>(0);

// atomでログ関数を作成する
const logCountAtom = atom(null, (get, set) => {
  const count = get(countAtom);
  console.log(count);
});

export default function App() {
  const setCount = useSetAtom(countAtom);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count Up</button>
      <LogCountButton />
    </div>
  );
}

function LogCountButton() {
  const logCount = useSetAtom(logCountAtom);

  // count変更による再レンダリングが起きない
  console.log("render LogCountButton");

  return (
    <button onClick={() => logCount()}>
      Log Count
    </button>
  );
}
```

## まとめ

Jotaiはグローバルステートを持てる以外にも、パフォーマンス最適化にも優れていることが分かりました。すごいですね。
