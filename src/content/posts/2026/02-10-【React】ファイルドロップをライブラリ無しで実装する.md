---
title: 【React】ファイルドロップをライブラリ無しで実装する
pubDate: 2026-02-10
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## Reactでのファイルドロップ

Reactでファイルドロップするには、ライブラリを使うのが通常かと思います。ただライブラリをできるだけ削りたい事情がある場合、通常のAPIだけで賄いたいといったことがあります。

## ファイルドロップの罠

ファイルドロップを実装する場合、以下のような流れが思い浮かびます。

- ドロップ入ったらstateを"over"に
- ドロップ出たらstateを"idle"に
- ドロップイベントでファイル処理
- あれ？簡単じゃね？

しかし単純に実装すると、以下のようになります。

- ドロップ入ったらstateが"over"になる
- マウスが子要素に入ったらstateが"idle"になる
- つまりドロップゾーン内にもかかわらずstateが"idle"になってしまう

これは困りました。

## 動作確認

以下のようなコードで確認してみます。

```tsx
export default function App() {
  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        console.log("onDragEnter");
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        console.log("onDragLeave");
      }}
      style={{ width: 500, height: 500, background: "gray" }}
    >
      <div style={{ width: 100, height: 100, background: "red" }}>A</div>
      <div style={{ width: 100, height: 100, background: "blue" }}>B</div>
    </div>
  );
}
```

すると以下のようになります。

- onDragEnterが発火
- 子要素の行き来でonDragLeave,onDragEnterが発火

つまり全ての要素で同じイベントが発火していることになります。なるほど確かに、これだと思い通りにいかないことが明白です。

## カウント対策

色々な対策方法があるかと思いますが、カウント方式が一番シンプルかと思います。具体的には、enterでインクリメント、leaveでデクリメントし、0になれば全ての要素から出たと判定します。以下のようにします。

```tsx
import { useRef } from "react";

export default function App() {
  // カウント用Ref
  const dragCountRef = useRef(0);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        // enterでcountインクリメント
        dragCountRef.current++;
        console.log("onDragEnter");
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        // leaveでcountデクリメント
        dragCountRef.current--;
        console.log("onDragLeave");

        if (dragCountRef.current === 0) {
          // count0で本当に外に出ている
          console.log("外に出ました！");
        }
      }}
      style={{ width: 500, height: 500, background: "gray" }}
    >
      <div style={{ width: 100, height: 100, background: "red" }}>A</div>
      <div style={{ width: 100, height: 100, background: "blue" }}>B</div>
    </div>
  );
}
```

シンプルで良いですね。
