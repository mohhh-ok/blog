---
title: "【MP4】moov atomの配置を最適化してweb対応させる"
pubDate: 2024-12-12
categories: ["動画"]
tags: []
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## moov atom

moove atomには、mp4に含まれるヘッダ情報で、再生に必要なものが含まれています。これが先に読み込まれないと、web上での動画再生に問題が発生する恐れがあります。そのため、これをファイルの早い段階に配置する必要があります。

## 現在の位置を確認する

以下のようにして確認できます。ffmpegを使用しています。

```
ffprobe -v trace -i input.mp4 2>&1 | grep "moov"
```

問題となるファイルでは、以下の結果となりました。

```
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x13ae11b10] type:'moov' parent:'root' sz: 59094 7550069 7609155
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x13ae11b10] type:'mvhd' parent:'moov' sz: 108 8 59086
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x13ae11b10] type:'trak' parent:'moov' sz: 25926 116 59086
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x13ae11b10] type:'trak' parent:'moov' sz: 32954 26042 59086
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x13ae11b10] type:'udta' parent:'moov' sz: 98 58996 59086
```

一行目の部分が、moov atomです。この場合、サイズが59KB, 開始位置が7.5MB, ファイルサイズが7.6MBとなっています。

つまり、moov atomがファイルの後方に来てしまっており、このままではwebでの再生に問題が生じる可能性が高いです。

## 位置を修正する

ffmpegでも修正できると思いますが、今回はGUIツールを使用します。Sublerを使用します。

https://subler.org/

Sublerで動画ファイルを読み込み、FileメニューからOptimizeを選択すると、一瞬で最適化が終了します。

もう一度確認してみます。

```
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x121005fa0] type:'moov' parent:'root' sz: 59133 40 7609186
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x121005fa0] type:'mvhd' parent:'moov' sz: 108 8 59125
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x121005fa0] type:'trak' parent:'moov' sz: 25922 116 59125
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x121005fa0] type:'trak' parent:'moov' sz: 32997 26038 59125
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x121005fa0] type:'udta' parent:'moov' sz: 98 59035 59125
```

今度は開始位置が40Bとなり、moovを先頭に持ってくることができました。
