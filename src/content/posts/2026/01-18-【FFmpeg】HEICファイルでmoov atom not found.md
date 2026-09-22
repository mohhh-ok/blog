---
title: "【FFmpeg】HEICファイルでmoov atom not found"
pubDate: 2026-01-18
categories: ["動画"]
---

こんにちは、フリーランスエンジニアのmohです。

## moov atom not found

HEICファイルは画像ですが中身はmp4だそうで、ファイルの後ろにmoov atomが入っています。こうしたHEICをFFprobeで読み込もうとしたところエラーになりました。

```sh
Command failed with exit code 1: ffprobe -v error -select_streams 'v:0' -show_entries 'stream=width,height' -of json /tmp/xxx

[mov,mp4,m4a,3gp,3g2,mj2 @ 0x5579293bf100] moov atom not found
```

これはテストチャンスだ。やっほう（棒読み）。早速該当ファイルを突き止めローカルでのテストコードを書きました。しかしローカルでは成功してしまいます。なぜなのか。

## HEIC対応は7.0から

FFmpeg 7.0からHEIC対応になったようです。

> Support for HEIF/AVIF still images and tiled still images

https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/Changelog

それ以前ではHEIC非対応とのことです。これが原因の可能性が高いです。

該当の環境ではnode:lts-slimイメージを使用して、apt-getでFFmpegをインストールしています。これはおそらく7以前になっています。

このため下記のイメージを使います。

https://johnvansickle.com/ffmpeg/

2026年1月18日現在FFmpeg 7.0.2となっています。ビルド時間が長くなることを懸念していたのですが、Claude様によるとapt-getと大して変わらないそうですので、安心して移行します。

```ts
// daggerを使用

const FFMPEG_URL = `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`;

// ...
.withExec(["wget", FFMPEG_URL, "-O", "/tmp/ffmpeg.tar.xz"])
.withExec(["tar", "xf", "/tmp/ffmpeg.tar.xz", "-C", "/tmp", "--strip-components=1"])
.withExec(["mv", "/tmp/ffmpeg", "/usr/local/bin/"])
.withExec(["mv", "/tmp/ffprobe", "/usr/local/bin/"])
.withExec(["chmod", "+x", "/usr/local/bin/ffmpeg", "/usr/local/bin/ffprobe"])
.withExec(["rm", "-rf", "/tmp/ffmpeg*"])
// ...
```

これで該当エラーがなくなりました。

## まとめ

FFmpegは、apt-getではなくせめて7以上を使うのがいいですね。ただしv7.1.1は回転のバグがあるので、上記の7.0.2か、あるいは最新の8系が良いのではないかと思います。
