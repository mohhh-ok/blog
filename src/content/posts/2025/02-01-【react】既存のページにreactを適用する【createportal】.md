---
title: "【React】既存のページにReactを適用する【createPortal】"
pubDate: 2025-02-01
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## React

Reactは、インタラクティブなUIを比較的手軽に実装できるフレームワーク、厳密にはライブラリです。通常、１ページに１つマウントします。複数マウントするにはcreateRootを複数使用するなどもありますが、その場合は状態が共有されません。今回は、createPortalを使用して、状態を共有しつつ、複数のコンポーネントを既存のページにマウントしていきます。

## createPortal

以下で解説されています。

[https://ja.react.dev/reference/react-dom/createPortal](https://ja.react.dev/reference/react-dom/createPortal)

新しく追加する要素、既存の要素、キーの順に指定します。

```jsx
<div>
  <SomeComponent />
  {createPortal(children, domNode, key?)}
</div>
```

## 既存の複数要素にマウントする

以下のようにします。

```markup
// index.html
// ...
 <h2>既存のページ</h2>
  <ul id="existing-list">
    <li class="some-class">アイテム1</li>
    <li class="some-class">アイテム2</li>
    <li class="some-class">アイテム3</li>
  </ul>

  <div id="root" style="border: 1px solid red"></div>
  <script type="module" src="/src/main.tsx"></script>
// ...
```

```jsx
// App.tsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const App = () => {
  const [targetLis, setTargetLis] = useState<HTMLElement[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const lis = Array.from(document.querySelectorAll("li.some-class")) as HTMLElement[];
    setTargetLis(lis);
  }, []);

  return <>
    <h2>React</h2>
    {targetLis.map((li) =>
      createPortal(
        <button
          onClick={() => setCount(count + 1)}
        >
          {count}
        </button>,
        li
      )
    )}
  </>
};

export default App;
```

Reactはid=rootにレンダリングしていますが、createPortalを使用した部分だけは、既存のリストに追加されています。ボタンを押すと、全体で共有される状態管理が適用され、すべての数字がインクリメントされます。これは便利。

## 想定される用途

今回、Chrome拡張で既存のページにReactを入れたくて調べました。思ったより簡単にできそうでよかったです。他にも、色々使い道はありそうです。Electronだとか、Bookmarkletだとか。うむ。
