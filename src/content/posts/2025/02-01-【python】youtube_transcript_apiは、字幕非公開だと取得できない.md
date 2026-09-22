---
title: "【Python】youtube_transcript_apiは、字幕非公開だと取得できない"
pubDate: 2025-02-01
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## youtube\_transcript\_api

youtube\_transcript\_apiは、pythonで使えるyoutubeの字幕取得ライブラリです。YouTube側で自動生成された字幕を取得しているようです。

## 取れないこともある

以下の動画では、字幕が非公開となっているようです。

https://www.youtube.com/watch?v=rdwz7QiG0lk

下記のように実装してみます。

```python
from youtube_transcript_api import YouTubeTranscriptApi

video_id = 'rdwz7QiG0lk'
txt = YouTubeTranscriptApi.get_transcript(video_id)
print(txt)
```

以下の結果になりました。

```
youtube_transcript_api._errors.TranscriptsDisabled: 
Could not retrieve a transcript for the video https://www.youtube.com/watch?v=rdwz7QiG0lk! This is most likely caused by:

Subtitles are disabled for this video
```

もしかすると、公開非公開関係なく、自動生成された結果を取れるのではないかと期待したのですが、無理なようです。
