---
title: "【AI】CPUで動くLLM「Gemma3」試してみた"
pubDate: 2025-03-20
categories: ["AI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## LLM

LLMは通常、GPUがないと厳しいといった印象があります。しかし最近発表されたGemma3は、CPUでもサクサク動作します。今回、Gemma3を試してみました。

環境：

*   Mac Mini M2 24GB

## LM Studioをインストール

下記から、LM Studioをダウンロードします。

[https://lmstudio.ai](https://lmstudio.ai)

## Gemma 3をインストール

下記より、Gemma 3をインストールします。

[https://lmstudio.ai/models](https://lmstudio.ai/models)

上記はブラウザですが、LM Studioからモデル検索もできます。その場合、マシンに適合するかの判定も出ます。私の環境では、27Bは無理そうでした。次に候補となるのは12Bですが、それほどガッツリ使う予定もないので、4Bにしました。4Bは、画像読み込み対応の最低モデルとなります。

## 用途を考える

せっかくローカルでそこそこいい感じのAIを動かせるので、何かに使いたい！ですがGemma 3はハルシネーションがひどいとのことです。

[https://github.com/lechmazur/confabulations](https://github.com/lechmazur/confabulations)

なのでファクトチェックを必要としない用途で使う必要があります。

候補

*   英語の練習
*   歌詞生成の手助け
*   ダミーデータ生成

クリエイティブな用途には、品質に目をつぶれば使えそうですね。品質に目をつぶれば。品質に目を瞑れば。

## 英語の練習してみた

以下のように、先生になってもらいました。速度はサクサク動いて快適です。

```
system prompt:
You are an english native person. please teach me english! please talk shortly.
```

```
You
hello

Assistant
Hey there! 👋 It’s great to meet you!

Let's start with something simple. How’s your day going so far? 😊

Don’t worry about making mistakes – that’s totally normal when learning a new language! We can take it slow and build from here.


You
i installed gemma3 today

Assistant
Wow, that's fantastic! Gemma 3 sounds really impressive. 🎉 What are you planning to do with it? Are you experimenting with different tasks? 😄


You
i want to improve my english

Assistant
That’s brilliant! I can definitely help you with that. 😊  What kind of things would you like to focus on – conversation, grammar, vocabulary...?
```

とうぶんこれで、英語を鍛えようと思います。ゆくゆくは、海外案件を取れるようになりたいなと。
