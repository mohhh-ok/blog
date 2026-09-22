---
title: 【Sharp】HDRのAVIF読み込みでBitstream not supported by this decoder
pubDate: 2026-01-01
categories: ["Node.js"]
---

こんにちは、フリーランスエンジニアのmohです。

## 問題の概要

Node.jsの画像処理ライブラリ「Sharp」でAVIF画像を読み込んで処理しようとしたところ、エラーが発生しました。メタデータの取得は成功するものの、実際の変換処理でエラーとなる現象です。

## エラーの再現

以下のコードで問題を再現できます。

```ts
import sharp from "sharp";

const TEST_FILE = "test.avif";

async function test() {
  try {
    const metadata = await sharp(TEST_FILE).metadata();
    console.log("Metadata:", metadata);
    
    // リサイズして別ファイルに出力
    await sharp(TEST_FILE).resize(100, 100).toFile("converted.avif");
    console.log("変換完了");
  } catch (error) {
    console.error(error);
  }
}

test();
```

### 出力結果

メタデータは正常に取得できます。

```js
Metadata: {
  format: "heif",
  width: 416,
  height: 740,
  space: "rgb16",
  channels: 3,
  depth: "ushort",
  isProgressive: false,
  isPalette: false,
  bitsPerSample: 10,  // ← 10-bitであることに注目
  pages: 1,
  pagePrimary: 0,
  compression: "av1",
  hasProfile: false,
  hasAlpha: false,
  autoOrient: {
    width: 416,
    height: 740,
  },
}
```

しかし、変換処理でエラーが発生します。

```sh
error: test.avif: bad seek to 13948
test.avif: bad seek to 13921
test.avif: bad seek to 13917
heif: Invalid input: Unspecified: Bitstream not supported by this decoder (2.0)
```

## 原因の特定

### 10-bit AVIFの確認

`heif-info`コマンドで画像の詳細を確認します。

```sh
% heif-info -d test.avif | grep bit
| | | bits_per_channel: 10,10,10
| | | high_bitdepth: 1
| | | twelve_bit: 0
```

この結果からも、10-bit depth（ビット深度）のAVIF画像であることが判明しました。

### Sharpの制限

Sharpの公式ドキュメントによると、プリビルドバイナリでは8-bit depthのAVIFのみサポートされています。

> Prebuilt binaries limit AVIF support to the most common 8-bit depth.

参考: [Sharp Changelog v0.28.0](https://sharp.pixelplumbing.com/changelog/v0.28.0/)

関連issue: https://github.com/lovell/sharp/issues/2688

つまり、**プリビルドSharpは10-bit以上のAVIF画像の入力（デコード）に対応していない**ことが原因でした。

## Sharp v0.33.3での10-bit出力対応

2024年3月リリースのv0.33.3から、10-bit/12-bit AVIFの**出力**には対応しています（[PR #4036](https://github.com/lovell/sharp/pull/4036)）。

```ts
// v0.33.3以降で使用可能
await sharp(input)
  .avif({ bitdepth: 10 })  // または 12
  .toFile(output);
```

ただし、これはあくまで**出力のみ**の対応のようです。またプリビルドバイナリでは8ビットのみサポートされているため、10ビットや12ビットを使用するには--build-from-sourceでソースからビルドする必要があるようです。

## 解決策

FFmpegやImageMagickは10-bitに対応しているため、それらで変換するか、Sharpから乗り換える必要があります。

## まとめ

- Sharp v0.33.3で10-bit AVIF**出力**には対応したが、**入力**は未対応
- プリビルドバイナリは8-bitのみ（入力・出力とも）
- 10-bit AVIF画像を読み込むにはFFmpegやImageMagickを使用する

iPhoneが標準で10-bit撮影する時代に、Sharpの入力対応が待たれます。
