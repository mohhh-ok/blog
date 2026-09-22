---
title: "【React】データ更新時にスクロールを固定する"
pubDate: 2025-09-11
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 更新の前後でスクロール位置の固定

スクロール位置を固定するには、単純に考えれば以下のような流れとなります。

*   更新前のscrollHeightを保存
*   更新実行
*   現在のscrollHeightと更新前の値を計算
*   差分位置までスクロール

しかし実際はReactだとレンダリングのタイミングなども考慮しないといけません。計算のタイミングで、レンダリングが終わっている保証がないためです。そのため、下記のように修正します。

*   更新前のscrollHeightを保存
*   更新実行
*   下記を300ms間繰り返す
    *   現在のscrollHeightと更新前の値を計算
    *   差分位置までスクロール

またレンダリングを走らせるためにrequestAnimationFrameを使う必要もあります。

## コード

下記のようになります。

```typescript
function ScrollSample() {
  // スクロール要素の参照
  const scrollRef = useRef<HTMLDivElement>(null);

  // データ取得関数
  const refetch = () => new Promise<void>(resolve => setTimeout(resolve, 1000))

  // スクロール位置を保持する関数
  const keepScrollPosition = (params: { prevHeight: number }) =>
    const timeout = 300;
    new Promise<void>((resolve) => {
      const { prevHeight } = params;
      const start = performance.now();
      const tick = () => {
        const el = scrollRef?.current;
        if (!el) return resolve();
        if (!el.isConnected) return resolve();
        if (performance.now() - start > timeout) return resolve();
        el.scrollTo({
          top: el.scrollHeight - prevHeight,
          behavior: 'instant',
        })
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  // 更新実行
  const handleClick = async () => {
    const el = scrollRef?.current;
    if (!el) return;
    const prevHeight = el.scrollHeight;
    await refetch();
    await keepScrollPosition({ prevHeight });
  }

  return <>
    <div ref={scrollRef}>
      {/* ここにデータを入れる */}
    </div>
    <button onClick={handleClick} >更新実行</button>
  </>
}
```

## 汎用ユーティリティを作る

下記のように汎用ユーティリティを作ると便利かと思います。

```typescript
export function keepRequestAnimationFrame(timeout: number, callback: () => void) {
  const start = performance.now();
  const tick = () => requestAnimationFrame(() => {
    callback();
    const now = performance.now();
    if (now - start > timeout) return;
    tick();
  });
  tick();
}


// 使用例
keepRequestAnimationFrame(timeout, async () => {
  const el = messageScrollRef?.current;
  if (!el) return;
  if (!el.isConnected) return;
  el.scrollTo({
    top: el.scrollHeight - prevHeight,
    behavior: 'instant',
  })
})
```
