---
title: "Kotoyokai（旧 Yokai no Sensei）"
personal: true
startDate: 2026-08
techs: ["Bun", "TypeScript", "React", "SQLite", "Drizzle", "Tailwind", "Stripe", "Railway"]
summary: 妖怪キャラクターが英語話者に日本語を教える会話チャットサービス。
heroImage: ./hero.webp
---

<https://kotoyokai.com>

2026-09-17 に Yokai no Sensei から Kotoyokai に改名。旧ドメインは新ドメインへリダイレクト。

TikTok: <https://www.tiktok.com/@yokai_no_sensei>

## 概要

- 妖怪や守護霊などのキャラクターと日本語で会話しながら学ぶチャットサービス。米国など日本国外の英語話者が主要ターゲット
- キャラクターごとに初期日本語レベルが異なり、初歩的な日本語しか使えず少しずつ成長するキャラと、最初から流暢に話すキャラがいる

## 設計上のポイント

- Bun.serve の HTML import によるフルスタック構成（バンドラ設定なし）
- LLM は OpenAI / Google / Anthropic を SDK を使わず fetch で直接呼ぶプロバイダアダプターで切り替え
- 返答は japanese / english / voice の JSON 構造を強制し、漢字のルビ「漢字[よみがな]」記法を `<ruby>` にパースして表示
- Google ログイン＋メール OTP 認証
- 課金は毎日リセットされる無料予算と、繰越ありのストックの2系統ポイント制（Stripe）
- 音声合成は DashScope / Fish Audio を切り替えられるアダプター構成
- 入力モデレーションなど、ユーザー危害系リスクに備えた安全機構

## TikTok

- アカウント [@yokai_no_sensei](https://www.tiktok.com/@yokai_no_sensei) で 2026-08-19 から定期投稿（当初は毎日、2026-09 からは隔日）で 15秒の2キャラ掛け合いスキットを投稿
- 対象は米国英語話者・日本語初級者。構成は「英語フックで注意を引く → 日本語フレーズの実演 → 英語で意味を解説 → 日本語で復唱 → 音声でのCTA」の15秒
- 動画はキャラクターの参照画像を渡す reference-to-video の動画生成モデルで音声込みに生成し、字幕を付けて投稿
- 題材の重複管理・公開状態を台帳で管理し、再生数・いいね率のスナップショットを取って題材・キャストの採用判断に使っている。伸びた題材は「いってきます」「これください」「ただいま」など毎日使う生活動作フレーズ
- キャラの絵柄ドリフト（老化・人間化・体格変化）との戦いが制作の主な手戻り要因

## 規模感

- 期間: 2026/08/14 〜 継続運用中
- コミット: 181 / TypeScript・TSX: 279 ファイル
- 1人開発（企画・実装・キャラ設定・画像生成・TikTok 運用）
