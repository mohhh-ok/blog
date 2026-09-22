---
title: 【Remotion】プレビューとコンバートが一体化した動画編集システム
pubDate: 2025-12-07
categories: ["React"]
---

こんにちは、フリーランスエンジニアのmohです。

## 背景

動画編集サービスを作成するにあたって、いくつか課題がありました。

- UIの工数ボリュームが大きい
- プレビューとコンバートとでコードが分かれてしまう
- プレビューとコンバートとで成果物を一致させる工数が跳ねそう

これは厳しそうです。

## Remotion

Remotionは、Reactを用いることでフロントとバックとで同じコードを用いて動画生成できます。

https://www.remotion.dev

> Create real MP4 videos with React.
> Parametrize content, render server-side and build applications.

動画生成時にはChrome headless shellが使われています。これにより、CSSなどの見た目をバックグラウンドでも再現しているようです。またFFmpegも使用されています。なおFFmpeg単体で生成するよりは時間コストがありそうです。

商用利用について、個人事業や小規模事業なら無料ですが、場合によってはライセンス購入も必要となっています。

https://www.remotion.pro/license

さっそく試してみました。

## Next.jsで初めてみた

```
pnpm create video@latest
```

これで、Next.jsを選択します。

### フロント確認

完了したら起動します。

```
pnpm i
pnpm dev
```

起動するとNext.jsのロゴマークのアニメーションが表示されました。見た目はビデオコンポーネントのようですが、実際はdivで動的にアニメーションが生成されています。

Mainコンポーネントは以下のようになっています。

```tsx
// src/remotion/MyComp/Main.tsx

export const Main = ({ title }: z.infer<typeof CompositionProps>) => {
  // ...

  return (
    <AbsoluteFill className="bg-white">
      <Sequence durationInFrames={transitionStart + transitionDuration}>
        <Rings outProgress={logoOut}></Rings>
        <AbsoluteFill className="justify-center items-center">
          <NextLogo outProgress={logoOut}></NextLogo>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={transitionStart + transitionDuration / 2}>
        <TextFade>
          <h1
            className="text-[70px] font-bold"
            style={{
              fontFamily,
            }}
          >
            {title}
          </h1>
        </TextFade>
      </Sequence>
    </AbsoluteFill>
  );
};
```

Sequenceコンポーネントで個別のシーケンスを作っているようです。

### 変換処理確認

とりあえずRender Videoボタンを押してみます。以下のエラーになりました。

```
Error: Set up Remotion Lambda to render videos. See the README.md for how to do so.
```

AWS Lambdaを設定しろとのことです。これはやめて、コマンドで変換してみます。

```
pnpm render
```

outディレクトリに動画が生成されました。

## Render Serverを試してみる

続いてサーバーでの利用を確認してみます。別でプロジェクトを作成しなおします。

```
pnpm create video@latest
```

「Render Server」を選択して作成します。Expressのサーバーが作成されます。

実行してみます。

```
pnpm i
pnpm exec remotion render
```

サンプル動画が作成されました。これはサーバーを通していないため、改めてExpressのコードを見てみます。

```ts
// server/index.ts

// Endpoint to create a new job
app.post("/renders", async (req, res) => {
  const titleText = req.body?.titleText || "Hello, world!";

  if (typeof titleText !== "string") {
    res.status(400).json({ message: "titleText must be a string" });
    return;
  }

  const jobId = queue.createJob({ titleText });

  res.json({ jobId });
});
```

jobをエンキューする形のようです。実際の変換処理は以下です。

```ts
// server/render-queue.ts

await renderMedia({
  cancelSignal,
  serveUrl,
  composition,
  inputProps,
  codec: "h264",
  onProgress: (progress) => {
    console.info(`${jobId} render progress:`, progress.progress);
    jobs.set(jobId, {
      progress: progress.progress,
      status: "in-progress",
      cancel: cancel,
      data: job.data,
    });
  },
  outputLocation: path.join(rendersDir, `${jobId}.mp4`),
});
```

titleTextをパラメータとして受け取っています。ここを工夫すれば、サーバー運転で好きな動画を作成できそうです。

## 備考

Next.js, Expressともに、pnpm devを実行した時にChrome Headless Shellのダウンロードが始まります。サーバーレス環境では起動時間に関わるため、構築時にあらかじめインストールするようにする必要がありそうです。
