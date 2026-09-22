---
title: "【React】setIntervalは古いStateを参照する"
pubDate: 2024-11-25
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## setIntervalは古いStateを参照する

setIntervalは、定期実行を行う関数です。感覚的には、これを使用すると、常に新しいStateを得られると思いがちです。ですがReactでは、useEffect内で起動したIntervalは、その時のStateを参照します。

以下のコードを試してみます。

```jsx
function App() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const output = () => console.log(count);
        const timer = setInterval(output, 1000);
        return () => clearInterval(timer);
    }, []);

    return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>
}
```

buttonをクリックすると、countが増えます。さらに初期化時に起動したintervalが、そのcountを参照しています。一見、interlvalは常に新しいcountを得るように見えますが、実際は常に古いcountを参照するため、コンソールには延々と0が出力されます。

## 依存配列に追加する必要がある

これを解決するには、依存配列にcountを追加する必要があります。

```jsx
function App() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const output = () => console.log(count);
        const timer = setInterval(output, 1000);
        return () => clearInterval(timer);
    }, [count]); // <= これ！

    return <button onClick={() => setCount(prev => prev + 1)}>Count: {count}</button>
}
```

これで、countが更新されるたびに、古いIntervalが破棄されるとともに新しいIntervalが起動し、予期した動作になります。
