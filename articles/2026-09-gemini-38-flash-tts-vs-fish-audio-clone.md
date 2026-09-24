---
title: "Gemini 3.8 Flash TTSの声クローンをFish Audioと聴き比べた"
emoji: "🎙️"
type: "tech"
topics: ["tts", "gemini", "fishaudio", "voiceclone", "ai"]
published: true
---

2026-09-22 に Google が Gemini 3.8 Flash TTS と Flash-Lite TTS を GA にしました。参照音声から声を複製する voice replication も入っています。普段 Fish Audio で日本語の voice clone をしているので、自分の声で作って聴き比べました。voice replication に対応しているのは Flash だけで、Flash-Lite は対応していない (API が 400 を返す) ので比べていません。

## 結論

- 声の似方は Fish Audio の勝ち。Fish は自分の声に聞こえました。Gemini は別の声になり、ひいき目に聴けば「同じ人が姿勢と気分を変えて読んだ」ですが、別人にも聞こえます。ただハキハキした声が欲しいなら Gemini でブーストするのもありかと。
- 読みはほぼ互角。数字・時刻・金額・英字略語・普通の漢字はどれも正しく読み、難読語の「東雲」は全条件で誤読しました
- 料金は 2026 年中なら同じくらいですが、Gemini は 2027-01-01 に倍になります
- Fish にも、ときどき日本語のイントネーションから外れる不満は残ります

日本語で「特定の人の声」を出したいなら、今のところ Gemini に乗り換える理由はありませんでした。

## 試した条件

参照音声は自分の声を iPhone12 のボイスメモで 25.7 秒録ったものです。台本を少し詰まりながら読んでいますが、実際の利用者の録音もそういうものなので、そのまま使いました。台本はAI製で、私は喫茶店で本を読む趣味はありません。

[音声を再生 (ref-source.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/ref-source.mp3)

Gemini の voice replication は、参照音声とは別に「同意文を本人が読んだ録音」が必須です。日本語の同意文はドキュメントに用意されていて、「私はこの音声の所有者であり、Googleがこの音声を使用して音声合成モデルを作成することを承認します。」を読みます。2 本の声が同じ人かを照合するので、同じマイク・同じ部屋で録ります。他人の声を勝手に複製できない作りです。

生成は次の 3 条件です。

1. Fish Audio `s2.1-pro`、参照音声の書き起こしあり
2. Fish Audio `s2.1-pro`、書き起こしなし (空文字で送ると受け付けました)
3. `gemini-3.8-flash-tts`

Gemini には書き起こしを渡す欄がありません。

読み上げ文は 2 本です。S1 は漢字の読み分け (市立/私立、日本橋/橋/端、大人、明日、東雲) を、S2 は数字と英字 (14時30分、4980円、96.5パーセント、API、AI、schedule) を見ます。

読みの判定は、生成音声を gpt-4o-transcribe で「聞こえたとおりカタカナで」書き起こさせました。通常の書き起こしは誤読を正しい漢字に直してしまうので使えません ([以前の記事](https://mohhh-ok.github.io/blog/posts/2026/08-24-aittsの誤読を全文かな化で潰したらイントネーションが崩れたので代替ttsを探す/))。声の似方とイントネーションは自分の耳で判定しました。コードは [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/09-24-gemini-tts-vs-fish-clone) にあります。

## 結果

| 条件 | 声の似方 | S1 の誤り | S2 の誤り | 生成時間 |
|---|---|---|---|---|
| Fish 書き起こしあり | 似ている | 東雲→ヒガシクモ | なし | 6.7〜6.9 秒 |
| Fish 書き起こしなし | 似ている | 東雲→ヒガシクモ | 14時→キュウヨジ、96.5 が崩れる | 5.4〜6.2 秒 |
| Gemini 3.8 Flash | 別の声 | 東雲→シロノメ | なし | 10.6〜10.7 秒 |

生成した音声です。上の参照音声と聴き比べてください。

### Fish Audio、書き起こしあり

S1

[音声を再生 (fish-text-s1.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/fish-text-s1.mp3)

S2

[音声を再生 (fish-text-s2.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/fish-text-s2.mp3)

### Fish Audio、書き起こしなし

S1

[音声を再生 (fish-notext-s1.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/fish-notext-s1.mp3)

S2

[音声を再生 (fish-notext-s2.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/fish-notext-s2.mp3)

### Gemini 3.8 Flash TTS

S1

[音声を再生 (gemini-flash-s1.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/gemini-flash-s1.mp3)

S2

[音声を再生 (gemini-flash-s2.mp3)](https://cdn.jsdelivr.net/gh/mohhh-ok/blog-examples@main/2026/09-24-gemini-tts-vs-fish-clone/audio/gemini-flash-s2.mp3)

### 読みと声の判定

各条件 1 本ずつの結果です。怪しい箇所は書き起こしを 2〜3 回やり直し、毎回同じ結果になったものだけを誤りとしました。Gemini の生成時間には、voice の作成 (6〜10 秒) が別にかかります。

違いが出たのは声の似方でした。読みは「東雲」以外の差がなく、東雲は 3 条件とも誤読です。Gemini の「シロノメ」がいちばん惜しいですが、正解ではありません。難読語は、どちらを使っても読み指定が要ります。

Fish の書き起こしなしで読みが崩れたのは S2 の数字でした。1 本だけの結果ですが、書き起こしを送るだけで避けられるので、送らない理由はありません。

## 料金

1 分あたりで比べます。日本語のナレーションは 1 分でおよそ 400 字です。

- Fish Audio: 100 万 UTF-8 バイトあたり $15。日本語 1 字はおよそ 2.4 バイトなので、1 分 $0.015 前後
- Gemini 3.8 Flash TTS: 音声出力 100 万トークンあたり $9。音声 1 秒が 25 トークンなので、1 分 $0.0135。2027-01-01 から $18 になり、1 分 $0.027

年内は Gemini Flash がわずかに安く、来年からは Fish のほうが安くなります。料金で乗り換える話にはなりません。

## 気になっている点

Fish の声の似方には満足していますが、ときどき日本語のイントネーションから外れた読み方をします。読みの誤りと違ってカタカナ書き起こしでは検出できないので、耳で確かめるしかありません。

Gemini は 150 以上の既製の声と、文章から声を作る voice design を持っています。「特定の人の声」が要らない用途なら、今回の比較とは別に試す価値があります。

## 参考

- [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog)
- [Gemini API: Voice replication](https://ai.google.dev/gemini-api/docs/voice-replication)
- [Gemini API: Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Fish Audio: Text to Speech API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech)
