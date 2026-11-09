---
title: "Kotoyokai（旧 Yokai no Sensei）"
personal: true
startDate: 2026-08
techs: ["Bun", "TypeScript", "React", "SQLite", "Drizzle", "sqlite-vec", "Capacitor", "Stripe", "RevenueCat", "ElevenLabs", "Railway"]
summary: 英語話者が日本語を学ぶサービス。ひらがなから順に進むコースと、妖怪の相棒とのチャット、かな・漢字のページとゲームを、Web と iOS アプリで 1 人で開発・運用。
heroImage: ./hero.webp
---

<https://kotoyokai.com>

iOS: <https://apps.apple.com/us/app/kotoyokai-learn-japanese-kana/id6813738172>

2026-09-17 に Yokai no Sensei から Kotoyokai に改名。旧ドメインは新ドメインへリダイレクト。

YouTube: <https://www.youtube.com/@yokai_no_sensei>\
TikTok: <https://www.tiktok.com/@kotoyokaidayo>

## 概要

米国など日本国外の英語話者が対象。最初は 14 体のキャラと話すチャットとして始め、2026-10 から「順に進むコース」と「ずっとそばにいる相棒」の形に作り直した。

- コース: ひらがなから始まり、カタカナ・語・文へ順に進む。新しい語は絵で答えが分かる問題から出し、3 択・組み合わせ・語のカードの並べ替えへ進む。次のレッスンはアプリが決める。登録不要で、進み具合は端末に残る
- 相棒: まめた・おこんの 2 体から 1 体を選ぶと、全ページの右下にいて、レッスン中に今の問題のことを聞ける。レッスンの外でもチャットで話せる。返答は漢字にルビ付きで音声で読み上げ、単語を押すと解説が出て単語帳に保存できる
- 自分で選んで学ぶページ: Kana（50 音表・書き順・なぞって練習）、Words、Numbers、Sentences、Kanji（図鑑）、Phrases（旅行の場面別フレーズの検索）
- Review: 覚えた語を思い出してから答えを見る復習
- ゲーム 4 本: ひらがなを集めて言葉にするむきおのゲーム、Kana Bounce、スマホのフリック入力に慣れる Kana Flick、円をぴったり払う Paying
- デイリーミッション: ゲーム・Review・コース・漫画を終えるとポイントがもらえる
- 英語の漫画、日本語学習の記事（Guides）
- iOS アプリを 2026-10-09 に App Store で公開（Capacitor）。Android 版は未公開
- ログインは Google / Apple / メール OTP。iOS アプリはゲストのまま始められる

## 設計上のポイント

- Bun.serve の HTML import によるフルスタック構成。SQLite + Drizzle、マイグレーションは起動時に自動適用
- LLM は OpenAI / Google / Anthropic を SDK を使わず fetch で呼ぶアダプター。返答は日本語・英訳・読み上げ文・単語・モデレーション判定をまとめた 1 つの JSON で受け、ルビの記法を `<ruby>` にして表示
- 音声合成はプロバイダを切り替えられるアダプター。本番は ElevenLabs
- フレーズ検索は sqlite-vec と OpenAI の埋め込み
- 課金は毎日リセットされる無料予算と、繰越ありのストックの 2 系統ポイント制。消費 pt はモデル別の原価に比例。Web は Stripe、iOS は RevenueCat 経由のアプリ内課金で、どちらも同じ台帳に書く
- 安全機構: 返答と同じ JSON で sexual / self-harm / プロンプトインジェクションを判定し、定型文に差し替える。AI 開示・自殺念慮への対応の公開ページ、California SB 243 対応
- 外部 API の費用をモデル別の価格表で記録し、管理画面で集計。管理者向けに日別のチャット要約

## SNS 運用

- YouTube ショートと TikTok に、キャラの掛け合いで日本語を 1 つ教える短い動画を投稿。動画はキャラの参照画像を渡す生成モデルで音声込みに作り、字幕を付ける
- 題材・キャスト・冒頭の型を 1 動画 1 行の台帳で管理し、再生数と継続率で採否を決める
- TikTok は視聴者が日本に偏ったため、2026-11 から地域が米国の新しいアカウントに投稿している
- キャラの絵柄のずれ（老ける・人間に寄る・体格が変わる）が制作の主な手戻り

## 規模感

- 期間: 2026/08/14 〜 継続運用中
- コミット: 4,889 / TypeScript・TSX: 1,389 ファイル・約 21.5 万行（うちテスト 425 ファイル）/ docs 137 ファイル（2026-11-09 時点）
- 1 人開発（企画・実装・法務文書・キャラ設定・画像/動画生成・SNS 運用）
