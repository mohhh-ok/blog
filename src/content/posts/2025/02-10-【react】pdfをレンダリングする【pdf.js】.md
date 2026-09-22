---
title: "【React】PDFをレンダリングする【PDF.js】"
pubDate: 2025-02-10
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## PDF

PDFはWeb上で表示するには、いろいろな方法があるかと思います。今回は、PDF.jsで直接表示します。

## コード

以下のようにします。canvasに描画しています。

```jsx
import { GlobalWorkerOptions, getDocument, version } from 'pdfjs-dist';
import { useEffect, useRef } from 'react';

// workerを指定
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfPath = '/test.pdf';
  const pdfPage = 2;

  useEffect(() => {
    initPdf();
  }, [])

  async function initPdf() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const pdf = await getDocument(pdfPath).promise;
    const page = await pdf.getPage(pdfPage);
    const viewport = page.getViewport({ scale: 1, rotation: 0 })
    canvas.height = viewport.height
    canvas.width = viewport.width
    const renderContext = {
      canvasContext: context,
      viewport,
    }
    page.render(renderContext)
  }

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default App

```

workerを指定する必要があるのですが、直接importするとうまくいきませんでした。そのため、importパスを用いたURLを生成しています。
