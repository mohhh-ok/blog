---
title: "【Sharp】VipsJpeg: premature end of JPEG image"
pubDate: 2025-11-16
categories: ['Node.js']
---

こんにちは、フリーランスエンジニアのmohです。

## 環境

sharp: ^0.34.5

## エラー

sharpでjpegを処理する際にエラーになりました。

```
Error: VipsJpeg: premature end of JPEG image at Sharp.toBuffer
```

これは困った。

## 原因と対処

他のJpegファイルは読み込めることから、対象のJpegが破損していたようです。ただしMac Finderのプレビューは表示されてましたので、読み込む方法はあると。

ImageMagickなら読み込めました。詳細は不明ですが、破損したデータでも読み込む仕組みがImageMagickにはあるようです。そこでSharpエラー時はImageMagickで変換をかけることにしました。

## ImageMagickのインストール

この方法を使うには、ImageMagickのインストールが必要です。

macOS: `brew install imagemagick`

## コード

```ts
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

/**
 * BufferからSharpインスタンスを安全に作成する
 * Sharpで読み込みエラーが発生した場合は、ImageMagickで一度PNG変換してから再度Sharpで読み込む
 * @param buffer 画像のバッファ
 * @returns Sharpインスタンス
 */
export async function bufferToSharpSafe(buffer: Buffer) {
  try {
    // まずSharpで読み込みを試みる
    const sh = sharp(buffer);
    // toBuffer()を呼び出して実際に読み込めるか検証
    await sh.toBuffer();
    return sh;
  } catch (error) {
    // Sharpで読み込めない場合は、ImageMagickで変換してから再度Sharpで読み込む
    const newBuffer = await bufferToPngBufferWithMagick(buffer);
    return sharp(newBuffer);
  }
}

/**
 * ImageMagickを使用してBufferをPNG形式のBufferに変換する
 * @param buffer 変換元の画像バッファ
 * @returns PNG形式の画像バッファ
 */
async function bufferToPngBufferWithMagick(buffer: Buffer): Promise<Buffer> {
  // 入力用の一時ファイルを作成
  return withTempFile("tmp", async (inputPath) => {
    // 出力用の一時ファイルを作成
    return withTempFile("png", async (outputPath) => {
      // バッファを一時ファイルに書き込み
      fs.writeFileSync(inputPath, buffer);
      // ImageMagickで変換を実行
      await anyToPngWithMagick({ inputPath, outputPath });
      // 変換後のファイルを読み込んでBufferとして返す
      return fs.readFileSync(outputPath);
    });
  });
}

/**
 * ImageMagickを使用して任意の画像形式をPNGに変換する
 * @param params 入力ファイルパスと出力ファイルパス
 */
async function anyToPngWithMagick(params: { inputPath: string; outputPath: string }) {
  const { inputPath, outputPath } = params;
  return myExec("magick convert", [inputPath, outputPath]);
}

/**
 * 一時ファイルを作成して処理を実行し、完了後に自動的に削除する
 * @param extension 一時ファイルの拡張子
 * @param fn 一時ファイルのパスを受け取って処理を実行する関数
 * @returns 処理結果
 */
async function withTempFile<T>(extension: string, fn: (filePath: string) => Promise<T>): Promise<T> {
  // タイムスタンプとUUIDを使用してユニークな一時ファイル名を生成
  const filePath = path.join(os.tmpdir(), `${Date.now()}-${crypto.randomUUID()}.${extension}`);
  try {
    // 処理を実行
    return await fn(filePath);
  } finally {
    // 処理完了後、一時ファイルを削除(エラーは無視)
    fs.unlink(filePath, () => { });
  }
}

/**
 * 外部コマンドを実行する
 * @param cmd 実行するコマンド
 * @param args コマンドに渡す引数の配列
 * @returns コマンドの実行完了を表すPromise
 */
function myExec(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(`Executing: ${cmd} ${args.join(" ")}`);
    const proc = spawn(cmd, args, { stdio: "pipe" });

    let stderrBuf = "";
    let stdoutBuf = "";

    // 標準出力をキャプチャ
    proc.stdout.on("data", (d) => {
      const output = d?.toString?.() ?? "";
      stdoutBuf += output;
      console.log(`[${cmd}] stdout:`, output.trim());
    });

    // 標準エラー出力をキャプチャ
    proc.stderr.on("data", (d) => {
      const output = d?.toString?.() ?? "";
      stderrBuf += output;
      // console.error(`[${cmd}] stderr:`, output.trim());
    });

    // プロセス終了時の処理
    proc.on("close", code => {
      if (code === 0) {
        // 正常終了
        console.log(`Done: ${cmd} ${args.join(" ")}`);
        resolve();
      } else {
        // 異常終了:エラーメッセージを構築
        const errorMsg = `Command "${cmd} ${args.join(" ")}" failed with exit code ${code}${
          stderrBuf ? `\nStderr: ${stderrBuf.trim()}` : ""
        }${stdoutBuf ? `\nStdout: ${stdoutBuf.trim()}` : ""}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    });

    // プロセス起動エラー時の処理
    proc.on("error", (err) => {
      const errorMsg = `Failed to spawn "${cmd}": ${err.message}`;
      console.error(errorMsg);
      reject(new Error(errorMsg));
    });
  });
}
```

これで安心ですね。
