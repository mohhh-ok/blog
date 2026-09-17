---
title: 【FFmpeg】動画=>画像変換でのHDR対応。AVIF vs WEBP
pubDate: 2025-12-31
categories: ["動画"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## FFmpegでのサムネイル生成

ffmpegでは、以下のようにしてサムネイルを生成します。

```sh
ffmpeg -i input.mp4 -vframes 1 output.jpg
```

## HDR問題

HDR(High dynamic range)の動画は色範囲が広い特徴がありますが、一般的な画像フォーマットでは表現できない場合があります。

例えばWEBPはwebで広く使われているフォーマットですが、HDRに対応していません。そのまま変換すると色がかなり変わってしまいます。そのためカラーマッピングを使用して、擬似的に再現する必要があります。

一方AVIFはHDRに対応しています。2024年時点で主要ブラウザがサポートを完了していることもあり、積極的に採用候補となり得ます。ただしエンコード・デコード速度はWEBPに劣るため、プロジェクト方針も考慮する必要があるでしょう。

## TypeScriptでのサンプル

以下はHDR動画を、カラーマッピングありのWEBP変換と、シンプルにAVIFでの変換のコードサンプルです。

```ts
import { execSync } from "child_process";

const INPUT_FILE = "test.MOV";
const OUTPUT_FILES = {
  avif: "test.avif",
  webp: "test.webp",
};

/**
 * HDR判定
 */
function isHDR(colorTransfer?: string): boolean {
  const hdrTransfers = ["arib-std-b67", "smpte2084", "bt2020-10", "bt2020-12"];
  return hdrTransfers.includes(colorTransfer || "");
}

/**
 * WEBPサムネイル生成
 * HDRの場合はオプションを追加して変換する
 */
function generateThumbnail(inputFile: string, outputFile: string): void {
  const colorTransfer = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer -of default=noprint_wrappers=1:nokey=1 "${inputFile}"`,
    { encoding: "utf-8" },
  ).trim();

  console.log("転送特性:", colorTransfer);
  console.log("HDR:", isHDR(colorTransfer));

  const hdrFilter =
    "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p";

  const vf = isHDR(colorTransfer) ? hdrFilter : "";
  const vfOpt = vf ? `-vf "${vf}"` : "";
  const colorOpts = isHDR(colorTransfer)
    ? "-color_trc bt709 -colorspace bt709 -color_primaries bt709"
    : "";

  const command = `ffmpeg -i "${inputFile}" -y ${vfOpt} ${colorOpts} -pix_fmt yuv420p -vframes 1 "${outputFile}"`;

  console.log("実行コマンド:", command);
  execSync(command, { stdio: "inherit" });
  console.log(`サムネイル生成完了: ${outputFile}`);
}

/**
 * AVIFサムネイル生成
 * HDRでも変わらず生成する
 */
function generateThumbnailAVIF(inputFile: string, outputFile: string): void {
  const command = `ffmpeg -i "${inputFile}" -vframes 1 "${outputFile}"`;

  console.log("実行コマンド:", command);
  execSync(command, { stdio: "inherit" });
  console.log(`サムネイル生成完了: ${outputFile}`);
}

// 実行
generateThumbnail(INPUT_FILE, OUTPUT_FILES.webp);
generateThumbnailAVIF(INPUT_FILE, OUTPUT_FILES.avif);
```
