---
title: 【Editframe】Remotionの対抗馬 - HTMLで動画生成
pubDate: 2026-05-01
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Editframe

EditframeはHTMLベースで動画を作成できるツールです。

https://editframe.com/

似たものにRemotionもありますが、違いは以下のようになっています。

- Remotion: React
- Editframe: HTML

## Editframeの強み

EditframeはAIによる生成が得意とされています。しかしAIによる生成はRemotionでも行えます。違いはどこにあるのでしょうか。

違いはHTMLかReactかです。Editframe公式によると、「HTML/CSS は LLM が最も訓練されている構文」「proprietary な animation API がないので幻覚を起こさない」と謳われています。つまりAIが扱うにはReactよりもHTMLが適しているという主張です。

私も以前Remotionを用いたAI駆動での動画作成を試したことがありましたが、あまりセンスはない印象でした。しかしEditframeで試してみたところ、割と実用に耐えれそうかなという感想を持ちました。もっとも以前とは違うモデル（以前は忘れましたが、今はOpus4.7）ですので、その違いはあるかもしれません。しかしReactで実装する際の余分な思考ロスがあると考えると、公式の主張もあり得るのかなとも思います。

## 構築

Editframeは簡単に構築できます。

```
npm create @editframe@latest
```

htmlかreactを選択できます。ここはhtmlを選択します。

```
npm run start
```

これでプレビュー画面が表示されます。あとはAIに指示するだけで、お好きな動画を作成できます。

## 編集UIの有利性

Remotionで編集UIを作ろうとすると、永続化のためにJSONを設計する必要がありました。しかしEditframeではHTMLをそのまま保存して再利用することができます。DOM操作とHTML保存部分を作るだけで良いわけです。アニメーションも今時はCSSでほとんどできますので、かなり凝ったものも作れそうです。

## まとめ

AIによる動画編集の選択肢は今後も増えていくと思います。導入は割とすぐにできるため、その時々で適した選択ができるといいのかなと思います。
