---
title: "Kotoyokai（旧 Yokai no Sensei）"
featured: 1
personal: true
startDate: 2026-08
techs: ["Bun", "TypeScript", "React", "SQLite", "Drizzle", "sqlite-vec", "Capacitor", "Stripe", "RevenueCat", "ElevenLabs", "Railway"]
summary: 英語話者が日本語を学ぶサービス。ひらがなから順に進むコースと、妖怪の相棒とのチャット、かな・漢字のページとゲームを、Web と iOS アプリで 1 人で開発・運用。
heroImage: ./hero.webp
---

英語を話す人が日本語を学ぶための Web サービスと iOS アプリ。ひらがなから順に進むコースを、妖怪の相棒に質問しながら進められる。企画から開発・運用・SNS まで 1 人でやっている。

[サイト](https://kotoyokai.com) / [App Store](https://apps.apple.com/us/app/kotoyokai-learn-japanese-kana/id6813738172) / [YouTube](https://www.youtube.com/@yokai_no_sensei) / [TikTok](https://www.tiktok.com/@kotoyokaidayo)

2026/08 に Yokai no Sensei として始め、2026/09 に今の名前に変えた。

## できること

- コース: ひらがな → カタカナ → 語 → 文と順に進む。絵を見て答える問題から始まり、選ぶ・並べ替える問題へ進む。登録しなくても始められる
- 相棒: 妖怪を 1 体選ぶと、どのページでも隅にいて、今の問題のことを聞ける。返事は読み仮名付きで読み上げられ、知らない単語は押すと説明が出る
- 自分で選んで学ぶページ: 50 音表となぞり書き、単語、数字、文、漢字、旅行の場面別フレーズ
- 復習、ゲーム 4 本、毎日のミッション、英語の漫画と学習記事
- iOS アプリは 2026-10 に公開。Android 版はまだ無い

## 作り

- 画面とサーバーは Bun と React、データは SQLite。iOS アプリは Web の画面を Capacitor（Web の画面をアプリにする仕組み）で包んでいる
- 相棒の返事は OpenAI・Google・Anthropic の AI を切り替えて使える。読み上げの声は ElevenLabs
- フレーズ検索は sqlite-vec（意味の近い文を探すため）
- チャットは毎日もらえるポイントで使い、足りなければ買える。支払いは Web が Stripe、iOS が App Store（RevenueCat 経由）
- AI の返事が性的な内容・自傷に当たる、または使う人の入力が AI への指示を乗っ取ろうとしていると判定したら、決まった文に差し替える
- YouTube と TikTok に、キャラの掛け合いで日本語を 1 つ教える短い動画を投稿している。動画は AI で作り、再生数で題材を選んでいる

1 人で作った量の目安: 3 か月でコミット 4,889 回、プログラム約 21.5 万行（2026-11-09 時点）。
