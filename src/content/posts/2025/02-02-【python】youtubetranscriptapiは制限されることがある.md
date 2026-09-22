---
title: "【Python】YoutubeTranscriptAPIは制限されることがある"
pubDate: 2025-02-02
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## TranscriptAPI

YoutubeTranscriptAPIは、Pythonで使える、Youtube字幕取得ライブラリです。

## 制限されることもある

今回、Cloud Run Functionsでデプロイしました。最初はうまくいっていたのですが、途中から途端に取得できなくなりました。

```
Could not retrieve a transcript for the video https://www.youtube.com/watch?v=XHSkvX5Z2Xo! This is most likely caused by:

Subtitles are disabled for this video
```

ローカルでは成功するので、おかしいなと。調べていると、以下のissuesを見つけました。

[https://github.com/jdepoix/youtube-transcript-api/issues/303](https://github.com/jdepoix/youtube-transcript-api/issues/303)

どうやらYouTube側で、IPレベルでの制限がかかっているのではないかという話です。
