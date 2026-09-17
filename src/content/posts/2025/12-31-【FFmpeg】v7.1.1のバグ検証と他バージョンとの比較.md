---
title: 【FFmpeg】v7.1.1の回転バグ検証と他バージョンとの比較
pubDate: 2025-12-31
categories: ["動画"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## FFmpegによる動画変換

FFmpegはCLIで使える動画編集ソフトです。

https://www.ffmpeg.org/download.html

下記バイナリ配布サイトでは、2025年12月31日現在v7.0.2がlatestとされています。このv7.0.2では、今回バグは見つかりませんでした。本家ではより上のバージョンが公開されていますが、本番などではビルド時間の節約などの理由から、実質下記のバイナリファイルを使うことになるかと思います。

https://johnvansickle.com/ffmpeg/

## v7.1.1とそれ以外との比較

ローカルではv7.1.1を使用していたのですが、ステージング環境v7.0.2とで結果に差異があったため今回調査しました。なお上位版であるv7.1.2, v7.1.3, v8.0.1も比較対象に追加しました。

下記のようなスクリプトで、バージョン間による比較をしました。シンプルにscaleのみ指定する場合と、filter_complexでウォーターマークを付与する場合とです。

```sh
#!/bin/bash

set -e

mkdir -p output

# シンプル
ffmpeg \
  -i test.MOV \
  -i watermark.png \
  -y \
  -vf "scale=720:1280" \
  -movflags faststart \
  -f mp4 \
  output/transformed_simple.mp4

# complex
ffmpeg \
  -i test.MOV \
  -i watermark.png \
  -y \
  -filter_complex "[0:v]scale=720:1280[scaled];[1:v]scale=700:-1,colorchannelmixer=aa=0.4[watermark];[scaled][watermark]overlay=(W-w)/2:(H-h)/2" \
  -movflags faststart \
  -f mp4 \
  output/transformed_complex.mp4

# complex:noauto
ffmpeg \
  -noautorotate \
  -i test.MOV \
  -i watermark.png \
  -y \
  -filter_complex "[0:v]transpose=1,scale=720:1280[scaled];[1:v]scale=700:-1,colorchannelmixer=aa=0.4[watermark];[scaled][watermark]overlay=(W-w)/2:(H-h)/2" \
  -movflags faststart \
  -f mp4 \
  output/transformed_complex_noauto.mp4

# complex:rotate0
ffmpeg \
  -i test.MOV \
  -i watermark.png \
  -y \
  -filter_complex "[0:v]scale=720:1280[scaled];[1:v]scale=700:-1,colorchannelmixer=aa=0.4[watermark];[scaled][watermark]overlay=(W-w)/2:(H-h)/2" \
  -movflags faststart \
  -metadata:s:v rotate=0 \
  -f mp4 \
  output/transformed_complex_rotate0.mp4

echo ""
echo "✓ 変換完了"
```

```dockerfile
FROM alpine:3.20

# ffmpegのバージョンをビルド引数として受け取る
ARG FFMPEG_VERSION=SET_THIS_ARG

# ビルドに必要な依存関係をインストール
RUN apk add --no-cache \
    build-base \
    curl \
    nasm \
    yasm \
    pkgconfig \
    x264-dev \
    x265-dev \
    lame-dev \
    opus-dev \
    libvpx-dev \
    libvorbis-dev \
    freetype-dev \
    libass-dev \
    fdk-aac-dev \
    bash \
    ca-certificates

# ffmpegをダウンロードしてビルド
WORKDIR /tmp
RUN curl -L https://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.xz | tar xJ && \
    cd ffmpeg-${FFMPEG_VERSION} && \
    ./configure \
        --prefix=/usr/local \
        --enable-gpl \
        --enable-version3 \
        --enable-nonfree \
        --enable-libx264 \
        --enable-libx265 \
        --enable-libvpx \
        --enable-libmp3lame \
        --enable-libopus \
        --enable-libvorbis \
        --enable-libfdk-aac \
        --enable-libass \
        --enable-libfreetype \
        --enable-small \
        --disable-debug \
        --disable-doc && \
    make -j$(nproc) && \
    make install && \
    cd / && \
    rm -rf /tmp/ffmpeg-${FFMPEG_VERSION}

# 不要なビルドツールを削除してイメージサイズを削減
RUN apk del build-base curl nasm yasm

WORKDIR /workspace

CMD ["/workspace/transformVideo.sh"]
```

```yaml
services:
  ffmpeg-7.0.2:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FFMPEG_VERSION: 7.0.2
    image: ffmpeg-test:7.0.2
    volumes:
      - ./test.MOV:/workspace/test.MOV:ro
      - ./output_7.0.2:/workspace/output
      - ./transformVideo.sh:/workspace/transformVideo.sh
      - ./watermark.png:/workspace/watermark.png

  ffmpeg-7.1.1:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FFMPEG_VERSION: 7.1.1
    image: ffmpeg-test:7.1.1
    volumes:
      - ./test.MOV:/workspace/test.MOV:ro
      - ./output_7.1.1:/workspace/output
      - ./transformVideo.sh:/workspace/transformVideo.sh
      - ./watermark.png:/workspace/watermark.png

  ffmpeg-7.1.2:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FFMPEG_VERSION: 7.1.2
    image: ffmpeg-test:7.1.2
    volumes:
      - ./test.MOV:/workspace/test.MOV:ro
      - ./output_7.1.2:/workspace/output
      - ./transformVideo.sh:/workspace/transformVideo.sh
      - ./watermark.png:/workspace/watermark.png

  ffmpeg-7.1.3:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FFMPEG_VERSION: 7.1.3
    image: ffmpeg-test:7.1.3
    volumes:
      - ./test.MOV:/workspace/test.MOV:ro
      - ./output_7.1.3:/workspace/output
      - ./transformVideo.sh:/workspace/transformVideo.sh
      - ./watermark.png:/workspace/watermark.png

  ffmpeg-8.0.1:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FFMPEG_VERSION: 8.0.1
    image: ffmpeg-test:8.0.1
    volumes:
      - ./test.MOV:/workspace/test.MOV:ro
      - ./output_8.0.1:/workspace/output
      - ./transformVideo.sh:/workspace/transformVideo.sh
      - ./watermark.png:/workspace/watermark.png
```

## 実行

下記コマンドで実行します。

```sh
docker compose up
```

## 結果

縦長動画で試したところ、結果は以下のようになりました。

- 7.0.2
  - simple: 縦長
  - complex: 縦長
  - complex:noauto: 縦長
  - complex:rotate0: 縦長
- 7.1.1
  - simple: 縦長
  - complex: 右90回転
  - complex:noauto: 右90回転
  - complex:rotate0: 右90回転
- 7.1.2
  - simple: 縦長
  - complex: 縦長
  - complex:noauto: 右90回転
  - complex:rotate0: 縦長
- 7.1.3
  - simple: 縦長
  - complex: 縦長
  - complex:noauto: 右90回転
  - complex:rotate0: 縦長
- 8.1.0
  - simple: 縦長
  - complex: 縦長
  - complex:noauto: 右90回転
  - complex:rotate0: 縦長
 

v7.1.1のcomplexバージョン全てと、v7.1.2のcomplex:noautoとで右に90回転していました。ffmpegのバージョン違いでここまで差が出ると厳しいです。

## AIによる考察

AIにffmpegのChangelogを読み込ませて答えてもらいました。

> 1. **7.0.2以前**: `filter_complex`使用時も回転メタデータが適切に処理されていた
> 2. **7.1.0〜7.1.1**: 回転処理に関するロジックが変更され、`filter_complex`使用時にメタデータが無視される挙動になった（バグ）
> 3. **7.1.2**: 上記のバグ修正が試みられた

ということだそうです。

## まとめ

ひとまずnoautoを使わない限りは、v7.0.2あるいはv7.1.2以降を使えば良さそうです。
