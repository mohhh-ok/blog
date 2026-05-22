---
title: "【FFmpeg】ffprobeでHEICのサイズが違う件"
pubDate: 2026-05-22
categories: ["未分類"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## 前提

- FFmpeg 8.1.1

## FFmpegでHEICサイズ取得

以下のコマンドでHEICファイルのサイズ（w,h）を取ろうとしました。

```sh
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height -of csv=p=0 test.HEIC
```

512x512になりました。しかしこれは実サイズと違います。試しに他のツールでもみてみます。

```sh
sips -g pixelWidth -g pixelHeight test.HEIC
# → pixelWidth: 4032 / pixelHeight: 3024

magick identify -format "%wx%h\n" test.HEIC
# → 4032x3024
```

他のツールなら実サイズが返ってきています。

## 原因

HEICはgrid仕様があり、単純な取得では実サイズが取れません。

## 正しい取り方（FFmpeg 7.0+）

`-show_stream_groups`を使います。

```sh
ffprobe -v error -of json -show_stream_groups test.HEIC \
  | jq -r '.stream_groups[0].components[0] | "\(.width)x\(.height)"'
# → 4032x3024
```

`jq`を使わない場合は`-show_entries`でフィールドを絞ります。

```sh
ffprobe -v error \
  -show_entries 'stream_group=index,id,type:stream_group_component=width,height,nb_tiles,coded_width,coded_height' \
  -of default=noprint_wrappers=1 \
  test.HEIC
# index=0
# id=0x31
# type=Tile Grid
# nb_tiles=48
# coded_width=4096
# coded_height=3072
# width=4032
# height=3024
```
