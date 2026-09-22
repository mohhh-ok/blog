---
title: 【Remotion】Compositionをバンドルして再利用する
pubDate: 2026-01-24
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## Remotion

RemotionはReactベースで動画を作成できるパッケージです。

## Compositionをバンドルして再利用する

Remotionでは、Playerなどを使用すると特に変換などを行わずに動画を確認できます。しかし実際に動画として出力するrenderMedia関数では、あらかじめコンポーネントをバンドルする必要があります。

### コンポーネントを準備

以下のようなMainがあったとします。

```tsx
// src/Main.tsx
export function Main(props) {
  return (
    <AbsoluteFill>
      MOVIE
    </AbsoluteFill>
  );
}
```

これをentryポイントで変換します。ここで設定する各種項目は後で上書きできるため、適当で大丈夫です。id違いの複数Compositionを渡すことも可能ですが、いったん１つで実装します。

```tsx
// src/entry.tsx
import { Composition, registerRoot } from "remotion";
import { Main } from "./Main";

registerRoot(() => (
  <>
    <Composition
      id="main"
      component={Main}
      durationInFrames={100}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
    {/* この後に他のCompositionも設定できる */}
  </>
));
```

### ビルドスクリプト

ビルドスクリプトを書きます。

```ts
// build.ts
import { bundle } from "@remotion/bundler";
import path from "path";

console.log("Building remotion compositions");
await bundle({
  entryPoint: path.join(process.cwd(), "./src/entry.tsx"),
  outDir: path.join(process.cwd(), "./.remotion-bundle"),
  webpackOverride: (config) => config,
});
console.log("Bundle success");
```

実行すると、.remotion-bundleに複数ファイルが生成されます。

### renderMediaで使用する

成果物をrenderMediaで使用します。何度もinputPropsを渡していますが、公式の説明に則っています。あえて変数は少なく読みやすくしています（本来はちゃんと変数を使います）。

```ts
// render.ts
import { renderMedia, selectComposition } from "@remotion/renderer";

// 成果物のパス
const bundleLocation = path.join(process.cwd(), "./.remotion-bundle");

// Mainに渡すinputPropsをここで設定できる
const inputProps = {}

// inputPropsを渡す
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: "main", // compositionのid
  inputProps,
});

// ここでinputProps以外を上書きできる
composition.width = 300;
composition.height = 200

// 再びinputPropsを渡す
await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation: `.out/movie.mp4`,
  inputProps,
});
```

これでCompositionを別パラメータで再利用して動画変換できるようになりました。

## おまけ: ビルドのwatchモード

調べたところ、2026年1月24日現在ではRemotionでのbundleにwatchモードはありません。remotion studioも試しましたが、こちらは成果物を生成しないようです。そのためchokidarなどを使用してwatchモードを自作する必要があります。AIに頼めばほぼ一発で生成できます。

```ts
import { bundle } from "@remotion/bundler";
import chokidar from "chokidar";
import path from "path";

let isBuilding = false;
let needsRebuild = false;

async function buildBundle() {
  if (isBuilding) {
    needsRebuild = true;
    return;
  }

  isBuilding = true;
  needsRebuild = false;

  try {
    console.log("Building remotion compositions");
    await bundle({
      entryPoint: path.join(process.cwd(), "./src/entry.tsx"),
      outDir: path.join(process.cwd(), "./.remotion-bundle"),
      webpackOverride: (config) => config,
    });
    console.log("Bundle success");
  } catch (error) {
    console.error("Bundle failed", error);
  } finally {
    isBuilding = false;
    if (needsRebuild) {
      buildBundle();
    }
  }
}

async function main() {
  const isWatch = process.argv.includes("--watch");

  await buildBundle();

  if (isWatch) {
    console.log("Watching for changes...");
    const watcher = chokidar.watch(
      path.join(process.cwd(), "./src"),
      {
        persistent: true,
        ignoreInitial: true,
      },
    );

    watcher.on("change", (filePath: string) => {
      console.log(`File changed: ${filePath}`);
      buildBundle();
    });

    watcher.on("add", (filePath) => {
      console.log(`File added: ${filePath}`);
      buildBundle();
    });

    watcher.on("unlink", (filePath) => {
      console.log(`File removed: ${filePath}`);
      buildBundle();
    });

    process.on("SIGINT", () => {
      console.log("\nStopping watcher...");
      watcher.close();
      process.exit(0);
    });
  }
}

main();
```
