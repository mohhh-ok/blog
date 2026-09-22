---
title: "【MUI】CircularProgressはパーセント指定すると揺れる"
pubDate: 2024-01-13
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## CircularProgressに%でsize指定してみる

CircularProgressのsizeにはパーセントでも指定できます。

```typescript
<CircularProgress size="20%" />
```

こうすると確かに、パーセント計算されたサイズで表示されます。ただし、なぜか揺れます。すっごく揺れます。おそらくCircularProgress自体が親コンテナのサイズを変えてしまって、計算がループしているのだと思いますが、詳しいことはわかりません。

## %がダメなら計算を入れる

ということですので、計算式を入れて動的にサイズ変更できるようにします。サイズ決定は読み込み時のみとなるため、ループは起こりません。今回は親コンテナの中央に、適切なサイズで表示するということをしたかったため、以下のようになりました。

```jsx
export function FullsizeLoading() {
    const RATE=0.15;
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<number>();

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const minDimension = Math.min(rect.width, rect.height);
        setSize(minDimension *RATE);
    }, [])

    return <div ref={containerRef} style={{
        width: "100%", height: "100%", display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }}>
        {size && <CircularProgress color="primary" size={size} />}
    </div>
}
```

useRefで親コンテナのサイズを取得し、幅か高さのどちらか小さい方にRATEを乗算して、サイズとしています。

## 小話

今日は酒をやめて、温かいBossのミルクティーにしました。それほど値段はしないだろうと思っていたのですが、思ったより高額でヘコんでます。なんなら酒の方が安いという。。。
