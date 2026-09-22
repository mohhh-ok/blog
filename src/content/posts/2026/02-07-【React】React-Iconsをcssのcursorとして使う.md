---
title: 【React】React IconsをCSSのcursorとして使う
pubDate: 2026-02-07
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## 目的

React Iconsのアイコンを、スタイルを当てた上でマウスカーソルに使用します。

## React Icons


React Iconsは、Font Awesome、Material Design Icons、Ioniconsなど、人気のあるアイコンライブラリを統一的なインターフェースで使用できるライブラリです。SVGベースで提供されるため、サイズやカラーを自由に変更できます。

https://react-icons.github.io/react-icons/

## renderToStaticMarkup

renderToStaticMarkupは、要素をHTML文字列に変換します。`react-dom/server`からインポートしますが、クライアントでも普通に使える便利ユーティリティです。

## コード

以下のコードでは、useEffect内でReact IconsのアイコンをdataURLに変換しています。

```tsx
import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IoMdResize } from "react-icons/io";

export default function App() {
  const [dataUrl, setDataUrl] = useState<string | undefined>();

  useEffect(() => {
    // React IconsのコンポーネントをSVG文字列に変換
    const svgString = renderToStaticMarkup(
      <IoMdResize style={{ color: "red" }} />,
    );
    const base64Svg = btoa(svgString);
    setDataUrl(`data:image/svg+xml;base64,${base64Svg}`);
  }, []);
  
  return (
    // cursor: url()の形式でカーソルを指定
    // 12 12はホットスポット(クリック位置)の座標、autoはフォールバック
    <div style={{ cursor: `url(${dataUrl}) 12 12, auto` }}>
      マウスを重ねるとカーソルが表示される
    </div>
  );
}
```
