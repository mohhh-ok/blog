---
title: "【Chrome】150でWeb Speech APIのonresultが返ってこない問題【quality】"
pubDate: 2026-07-24
categories: ["開発"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

Chrome 拡張に音声入力を付けようとして、`webkitSpeechRecognition` が「エラーも出さずに認識結果だけ返さない」状態にはまりました。原因は 2026 年 6 月末リリースの Chrome 150 が入れた仕様変更で、修正は 1 行です。同じ症状を踏む人が世界中にいるはずなので記録しておきます。

## TL;DR

Chrome 150 で `SpeechRecognitionOptions` に `quality` プロパティが追加され、**デフォルトが `"command"`(スマートホーム向けの限定語彙モード)** になりました。quality を指定していない既存コードはこのモードに落ち、自由文の発話に対して `onresult` が interim 含め一切発火しなくなります。

```js
const rec = new webkitSpeechRecognition();
rec.lang = "en-US";
rec.interimResults = true;
rec.quality = "dictation"; // ← これを足すだけで直る
rec.start();
```

Chrome 149 以前には `quality` プロパティ自体が無いので、この代入は無害な expando になるだけ。分岐なしで常に設定して問題ありません。

## 症状

エラーはでません。イベントを全部購読すると、こうなります:

```
onstart
onaudiostart
onsoundstart      ← 音は検出されている
onspeechstart     ← 発話としても検出されている
onspeechend
onsoundend
onaudioend
(このまま何も起きない。回によっては onerror: no-speech)
```

マイクのキャプチャも VAD(発話検出)も完全に動いているのに、`onresult` だけがゼロ件。`interimResults: true` なら本来は話している最中から途中経過が流れ続けるので、これは明確な異常です。

MDN の公式デモ([speech-color-changer](https://mdn.github.io/dom-examples/web-speech-api/speech-color-changer/))も、執筆時点の Chrome 150 では同じ理由で動きません。「自分のコードが悪いのでは」と疑って公式デモで確認しに行くと、公式デモも死んでいるので「環境が壊れた」と誤診するコースが完成しています。私は完走しました。

## quality の 3 段階

[仕様の explainer](https://github.com/WebAudio/web-speech-api/blob/main/explainers/quality-levels.md) から:

| 値 | 想定用途 |
|---|---|
| `"command"`(デフォルト) | 短いフレーズ・限定語彙(スマートホーム操作など) |
| `"dictation"` | 連続発話・一般語彙(SMS・メール入力など) |
| `"conversation"` | 複数話者・雑音耐性(会議・字幕など) |

デフォルトが最も制限の強い `"command"` である点、そして [Intent to Ship](http://www.mail-archive.com/blink-dev@chromium.org/msg16460.html) に「web-platform-tests でのカバレッジなし」と明記されたまま全ユーザーに有効化された点が、この破壊的挙動の背景です。ディクテーション用途のコードは全員 `"dictation"` の明示が必要になりました。

## 最小再現コード

ボタン 2 つで「未指定 vs dictation」を比較できるページを置いておきます:

[blog-examples/2026/07-24-web-speech-quality-chrome150](https://github.com/mohhh-ok/blog-examples/tree/main/2026/07-24-web-speech-quality-chrome150)

## おまけ: Chrome 拡張でマイクを使うときの権限の落とし穴

本題の調査中に確定させた、拡張 × マイクの権限モデルも書き残しておきます。

1. **content script から getUserMedia / SpeechRecognition を呼ぶと、マイク許可は「閲覧中サイトのオリジン」に付きます。** ユーザーから見ると「そのニュースサイトがマイクを要求してきた」ように見え、サイトごとに許可が必要。
2. **拡張ページを iframe で埋め込んでも回避できません。** マイクは delegated permission(許可はトップレベルオリジンが保持し、iframe は `allow` 属性で借りるだけ)なので、埋め込み先サイトごとに許可が要ります。拡張オリジンの iframe にも特例はありません(実機確認済み)。
3. **正解は offscreen document です。** 拡張のオプションページ(トップレベルの `chrome-extension://` タブ)で一度 getUserMedia を通すと、許可は拡張オリジンに記録される。offscreen document は同じ拡張オリジンなので、以後どのサイトを見ていてもプロンプトなしで getUserMedia できます。offscreen 自身は許可プロンプトを出せないので、「オプションページで 1 回許可」の導線が必須。
4. **SpeechRecognition は Chrome 135+ なら `start(mediaStreamTrack)` でトラックを直接渡せます。** 認識器が内部で getUserMedia を呼ばなくなるため、offscreen 内でも完結します。offscreen で getUserMedia → `rec.start(track)` + `quality: "dictation"` の組み合わせが、実機(Chrome 150)で end-to-end 動作しました。

定番の音声入力拡張が「オプションページでマイクを 1 回許可すれば全サイトで使える」構造になっているのは、この 3 + 4 の形です。

## 出典

- [Chrome 150 リリースノート](https://developer.chrome.com/release-notes/150)
- [Web Speech API quality levels explainer](https://github.com/WebAudio/web-speech-api/blob/main/explainers/quality-levels.md)
- [Intent to Ship: SpeechRecognition quality](http://www.mail-archive.com/blink-dev@chromium.org/msg16460.html)
- [SpeechRecognition.start(audioTrack) — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start)
- [Permissions in cross-origin iframes — Chromium](https://www.chromium.org/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes/)
- [chrome.offscreen — Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
