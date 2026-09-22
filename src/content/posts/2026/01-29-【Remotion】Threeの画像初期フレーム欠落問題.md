---
title: 【Remotion】Threeの画像初期フレーム欠落問題
pubDate: 2026-01-29
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。Remotionでの画像フィルタに関して書かせていただきます。

## 目的

動画作成ライブラリであるRemotion内で、画像に複雑なフィルタをかけたい。

## Remotion

Remotionは、Reactコンポーネントを使って動画を作成できるライブラリです。従来の動画編集ソフトとは異なり、コードベースで動画を生成できるため、プログラマブルに動画制作が可能です。フレームごとにReactコンポーネントがレンダリングされ、それを連結することで動画が完成するという仕組みです。

## 画像フィルタの選択肢

### Remotion + Context2Dのフィルター

Canvas 2D APIには`filter`プロパティが存在し、`blur()`や`brightness()`などのフィルタを適用できます。しかし2026年1月29日現在このContext2Dのフィルターは**Safari未対応**となっています。サーバーサイドでのレンダリングのみを行う場合は問題ありませんが、Remotion Playerを使用してブラウザ上でプレビューを確認する際には、この互換性の問題がネックとなってしまいます。

### Remotion + Pixi.js

Remotion + Pixi.jsの選択肢もあるかと思います。ただこちらはRemotionの正式なライブラリがないことから、かなり難航します。どうしてもフィルタ+画像レンダリングまで至れなかったため、Remotionが公式に対応しているThree.jsを使用することにしました。

### Remotion + Three.js

RemotionはThree.jsとの統合を公式にサポートしており、`@remotion/three`パッケージが提供されています。このパッケージには`ThreeCanvas`コンポーネントが含まれており、Remotionのフレームレンダリングと同期した3D描画が可能となります。WebGLで複雑なフィルタ処理を実現できる上に、React Three Fiberのエコシステムも活用できるため、非常に強力な選択肢となります。

## 初期フレーム欠落問題

Remotion + Three.jsの構成で挑みましたが、初期フレームがどうしても欠落する問題がありました。理論的には、初期時にdelayRenderでストップし、TextureLoaderで読み込んだ後にcontinueRenderを呼び出す事で、正確に画像が表示されるはずですが、実際には0.5秒ほど欠落します。Threeのキャンバス描画タイミングが、どうしても合いませんでした。

### Suspense + useLoaderでの対策

SuspenseとuseLoaderを使用する事で解決しました。以下のようにします。見通しのためプロパティなどは省略しています。

```tsx
import { useLoader } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";

export function ImageBackground() {
  // ...
  return (
    <AbsoluteFill>
      <Suspense fallback={null}>
        <ThreeCanvas>
          <ImageMesh />
        </ThreeCanvas>
      </Suspense>
    </AbsoluteFill>
  );
}

function ImageMesh() {
  const texture = useLoader(THREE.TextureLoader, src);

  return (
    <mesh>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
```

useLoaderは画像が読み込まれるまでSuspendするため、それをSuspenseで待機する形ですね。これで初期フレーム欠落がなくなりました。

## 注意: Playerではちらつきが発生

上記の方法でRender処理の問題は解決しましたが、ブラウザでのPlayer問題が発生しました。例えば以下のようなコードです。

```tsx
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Sequence } from "remotion";

export function ThreeProblem() {
  return (
    <AbsoluteFill>
      <Sequence from={0} style={{ background: "green" }}>
        <AbsoluteFill></AbsoluteFill>
      </Sequence>
      <Sequence from={20}>
        <AbsoluteFill>
          {/* blue背景と時間差でredが表示されてしまう */}
          <ThreeCanvas
            orthographic={true}
            width={800}
            height={800}
            style={{ backgroundColor: "blue" }}
          >
            <mesh>
              <planeGeometry args={[200, 200]} />
              <meshBasicMaterial color="red" />
            </mesh>
          </ThreeCanvas>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
```

一見すると問題ない、決して重い処理でもないシンプルな実装ですが、シーン切り替え時にレンダリングのずれが生じます。これはSequenceが移るタイミングで再マウントされる関係から、Canvasの再生成に時間がかかるためのようです。

### Sequenceのマウントタイミング

下記のコードでテストしてみます。

```tsx
import { useEffect } from "react";
import { AbsoluteFill, Sequence } from "remotion";

export function MountTest() {
  return (
    <AbsoluteFill>
      <Sequence from={10} style={{ background: "blue" }}>
        <Test name="Blue" />
      </Sequence>
      <Sequence from={50} style={{ background: "green" }}>
        <Test name="Green" />
      </Sequence>
    </AbsoluteFill>
  );
}

function Test(props: { name: string }) {
  useEffect(() => {
    console.log(`Test ${props.name} mounted`);
    return () => {
      console.log(`Test ${props.name} unmounted`);
    };
  }, []);
  return <div style={{ fontSize: 50 }}>{props.name}</div>;
}
```

Remotion Studioでテストした結果、以下のようになりました。

- 進む時はMountが蓄積される
- 戻る時はUnmountされる

前述のThreeCanvasは進むときのみ（戻ってから進むのも含む）ちらつきが発生していたため、納得の結果です。このことから、Sequenceのアンマウントを防ぐ方法が有効かもしれません。メモリに関しては、もともと進む場合に限ってはMountが蓄積される仕様のため、あまり気にしなくていい可能性があります。

### 内部実装を伴う修正

以下では内部実装を使用した解決策が提示されています。

https://github.com/remotion-dev/remotion/issues/4201

ただしRemotionのバージョンアップに伴って使えなくなる可能性があり、メンテナンスに難があります。

### 薄いラッパーで対策

下記のようなラッパーで対策することもできます。

```tsx
export function PreloadedSequence(
  props: Omit<SequenceProps, "from"> & {
    from: number;
    preloadFrames: number;
  },
) {
  const { from, preloadFrames, durationInFrames, children, ...rest } = props;
  const frame = useCurrentFrame();
  const isVisible = frame >= from;

  const actualFrom = Math.max(from - preloadFrames, 0);
  const actualPreloadFrames = from - actualFrom;

  return (
    <Sequence
      from={actualFrom}
      durationInFrames={durationInFrames ? durationInFrames + actualPreloadFrames : undefined}
      {...rest}
    >
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </Sequence>
  );
}
```

これを通常のSequenceの代わりに使用することで、実際のレンダリングより前にpreloadするとができます。ただ最初の１シーンはプリロードできないため、前述のSuspense + useLoaderが必要になってきそうです。
