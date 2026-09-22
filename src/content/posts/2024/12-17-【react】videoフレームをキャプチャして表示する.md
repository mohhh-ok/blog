---
title: "【React】videoフレームをキャプチャして表示する"
pubDate: 2024-12-17
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## videoフレームのキャプチャ

videoフレームは、canvasを使用してキャプチャできます。以下のような具合です。

```jsx
import { useRef } from "react";

export default function App() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    function captureFrame() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            throw new Error('video or canvas is null');
        }

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error('context is null');
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    return <>
        <button onClick={captureFrame}>キャプチャ</button>

        <video
            ref={videoRef}
            controls
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        />

        <canvas ref={canvasRef} />
    </>
};
```

## リアルタイムで描画する

リアルタイムで描画するには、requestAnimationFrameを用います。以下のような具合です。

```jsx
const drawFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
        throw new Error('video or canvas is null');
    }

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error('context is null');
    }

    // Canvasに現在の動画フレームを描画
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 次のフレームをリクエストして、アニメーションを続ける
    requestAnimationFrame(drawFrame);
}
```

## 再利用はCORSに注意

canvasをtoDataURLでimg srcに入れようとすると、CORSエラーになります。またtoBlobも使えないそうです（ChatGPT大先生言）。自サーバーの動画のみなら問題ありませんが、他サーバーの動画も扱う可能性がある場合は、canvasをそのまま使用するのがよさそうです。
