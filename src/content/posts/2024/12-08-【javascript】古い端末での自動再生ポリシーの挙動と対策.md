---
title: "【JavaScript】古い端末での自動再生ポリシーの挙動と対策"
pubDate: 2024-12-08
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

## 自動再生ポリシー

自動再生ポリシーは、近年のブラウザに搭載されている機能です。ユーザーのクリックを確認できないと、動画の音声を自動再生できないといったものになります。ユーザーの利便性向上につながるものですが、開発者泣かせの機能でもあります。

## 古い端末で挙動が違う

古い端末では、自動再生ポリシーの挙動が変わるようです。具体的には、iPad4 simulatorで確認しました。以下はReactで検証しています。

### 直接再生

直接再生する分には、古い端末でも問題ありません。

```jsx
// 古い端末でも動作する
function DirectPlay() {
    const ref = useRef<HTMLVideoElement>(null);

    return <>
        <button onClick={() => ref.current?.play()}>Play</button>
        <video src={SRC} ref={ref} />
    </>
}
```

### タイムアウトを使用

タイムアウトを使用すると、Chrome131では動作しますが、古い端末（iPad4 simulator）では動作しません。

```jsx
// 古い端末では動作しない
function TimeoutPlay() {
    const ref = useRef<HTMLVideoElement>(null);

    return <>
        <button onClick={() => setTimeout(() => ref.current?.play(), 1000)}>Set timeout</button>
        <video src={SRC} ref={ref} />
    </>
}
```

### クリック時一旦再生させて、その後タイムアウト

クリック時に一旦別動画を再生させます。その後目的の動画を再生させると、古い端末でも動作します。

これを実現するために、ダミー動画を作成します。黒画面、2x2ピクセル、0.1秒、無音トラックを持つ動画は以下のように作成できます。ffmpegを使用しています。

```bash
ffmpeg -f lavfi -i color=c=black:s=2x2:d=0.1 -f lavfi -i anullsrc=r=44100:cl=mono:d=0.1 -c:v libx264 -c:a aac -shortest interaction_dummy.mp4
```

これをbase64エンコードすると、以下のようになります。

```javascript
export const interactionDummyVideo =  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwJtZGF03gIATGF2YzYxLjE5LjEwMAACMEAOAAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzEwOCAzMWUxOWY5IC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAAv//72rvzLK3R/gQEYIAcBGCAHAAAACEGaIWxCv/7AARggBwEYIAcBGCAHAAAFp21vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAABkAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAJhdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAACAAAAAgAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAAAAUAAAAAAAAQAAAAAB2W1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAMgAAAAQAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAYRtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAFEc3RibAAAAMBzdHNkAAAAAAAAAAEAAACwYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAACAAIASAAAAEgAAAAAAAAAARVMYXZjNjEuMTkuMTAwIGxpYngyNjQAAAAAAAAAAAAAABj//wAAADZhdmNDAWQACv/hABlnZAAKrNlfiIjARAAAAwAEAAADAMg8SJZYAQAGaOvjyyLA/fj4AAAAABBwYXNwAAAAAQAAAAEAAAAUYnRydAAAAAAAARmkAAEZpAAAABhzdHRzAAAAAAAAAAEAAAACAAACAAAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABxzdHN6AAAAAAAAAAAAAAACAAACxQAAAAwAAAAYc3RjbwAAAAAAAAACAAAARQAAAxIAAAJxdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAgAAAAAAAABkAAAAAAAAAAAAAAABAQAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAAAAZAAABAAAAQAAAAAB6W1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAArEQAABU6VcQAAAAAAC1oZGxyAAAAAAAAAABzb3VuAAAAAAAAAAAAAAAAU291bmRIYW5kbGVyAAAAAZRtaW5mAAAAEHNtaGQAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAVhzdGJsAAAAfnN0c2QAAAAAAAAAAQAAAG5tcDRhAAAAAAAAAAEAAAAAAAAAAAABABAAAAAArEQAAAAAADZlc2RzAAAAAAOAgIAlAAIABICAgBdAFQAAAAABDYgAAAplBYCAgAUSCFblAAaAgIABAgAAABRidHJ0AAAAAAABDYgAAAplAAAAIHN0dHMAAAAAAAAAAgAAAAUAAAQAAAAAAQAAAToAAAA0c3RzYwAAAAAAAAADAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAMAAAABAAAALHN0c3oAAAAAAAAAAAAAAAYAAAAVAAAABAAAAAQAAAAEAAAABAAAAAQAAAAcc3RjbwAAAAAAAAADAAAAMAAAAwoAAAMeAAAAGnNncGQBAAAAcm9sbAAAAAIAAAAB//8AAAAcc2JncAAAAAByb2xsAAAAAQAAAAYAAAABAAAAYXVkdGEAAABZbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAsaWxzdAAAACSpdG9vAAAAHGRhdGEAAAABAAAAAExhdmY2MS43LjEwMA==';
```

上記ダミー動画を使用したコードが、以下になります。

```jsx
// 古い端末でも動作する
function DirectAndTimeoutPlay() {
    const ref = useRef<HTMLVideoElement>(null);

    function firstStep() {
        ref.current?.play().then(secondStep);
    }

    function secondStep() {
        setTimeout(() => {
            if (!ref.current) return;
            ref.current.src = SRC;
            ref.current.play();
        }, 1000);
    }

    return <>
        <button onClick={firstStep}>First step</button>
        <video src={interactionDummyVideo} ref={ref} />
    </>
}
```
