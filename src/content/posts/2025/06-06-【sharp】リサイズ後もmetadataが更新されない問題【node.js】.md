---
title: "【sharp】リサイズ後もmetadataが更新されない問題【Node.js】"
pubDate: 2025-06-06
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## sharp

sharpは、Node.jsで使える画像処理ライブラリです。リサイズ含め様々な処理が簡単に実装できます。

## 遭遇した問題

今回、sharpを用いてウォーターマークをつける部分で、エラーになりました。

```
Error: Image to composite must have same dimensions or smaller
```

んん？ウォーターマークは対象画像の50%サイズに計算しているのに、それより大きくなっているとはなんぞや。

どうやらresizeを呼び出しても、metadataがすぐには更新されないようです。

## resize後もmetadataが更新されない

下記のコードを実行すると、リサイズ後のmetadataがすぐには更新されないことがわかります。

```typescript
import sharp from "sharp";

async function main() {
  // インスタンス生成
  let sh = sharp('./test.png');
  console.log(await sh.metadata());  // 1024 x 1536

  // リサイズ
  sh = sh.resize(10, 10);
  console.log(await sh.metadata());  // 1024 x 1536

  // バッファ化
  const buffer = await sh.toBuffer();
  console.log(await sh.metadata());  // 1024 x 1536

  // インスタンス再生成
  const newSh = sharp(buffer);
  console.log(await newSh.metadata());  // 10 x 10
}

main();
```

この原因として、Claudeは以下のように回答しました。

> Sharpは遅延評価してるから、resize()を呼んでも実際にはまだ処理されてなくて、metadata()は元のサイズ（1024x1536）を返し続けてる。

なるほど、sharpの最適化処理により、metadataが反映されていないようです。

今回のテストで、以下のことがわかりました。

*   リサイズしても、metadataは更新されない
*   バッファ化しても、metadataは更新されない
*   新しくインスタンスを生成すると、metadataが更新される

これは把握していないとツボりそうです。

## 対策

下記のような対策が考えられます

*   計算後のサイズを保持して再利用する
*   パフォーマンスコストを無視してインスタンスを作り直す

それほど大きくない画像なら、インスタンス再生成でコードをスッキリさせるのもありかと思います。
