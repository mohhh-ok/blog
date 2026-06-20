# ブログプロジェクト

Astro製の技術ブログ。GitHub Pagesにデプロイ。

## コマンド

- パッケージマネージャ: **bun**（`bun install`, `bun run dev` など）
- `bun run dev` — 開発サーバー起動
- `bun run build` — ビルド
- `bun run check` — 型チェック

## URL

`astro.config.mjs` で `base: "/blog"` を設定しているため、**URLには必ず `/blog` が付く**。さらに**末尾スラッシュ `/` が必須**（ないと404になる）。

- 開発: `http://localhost:4321/blog/posts/YYYY/MM-DD-スラッグ/`
- 本番: `https://mohhh-ok.github.io/blog/posts/YYYY/MM-DD-スラッグ/`

正しい例: `http://localhost:4321/blog/posts/2025/04-24-aipostgres--drizzle--embedding%E3%81%A7%E6%84%8F%E5%91%B3%E6%A4%9C%E7%B4%A2%E3%81%99%E3%82%8B/`

ユーザーに記事URLを提示するときは `/blog` と末尾 `/` を忘れないこと。

## ブログ記事の作成

### 配置先

`src/content/posts/YYYY/MM-DD-タイトル.md`

例: `src/content/posts/2026/03-30-【Claude Code】freee-mcpで請求書作成してみた.md`

### frontmatter

```md
---
title: "記事タイトル"
pubDate: YYYY-MM-DD
categories: ["カテゴリ名"]
tags: []
---
```

- `categories` は `src/categories.ts` の `CATEGORIES` に定義されたもののみ使用可能
- 現在のカテゴリ: 未分類, Google, Google Cloud, Python, GAS, AI, PHP, Next.js, TypeScript, Node.js, MUI, React, HTML, Prisma, Database, Laravel, Flutter, C2PA, Drizzle, 開発
- `draft: true` で下書き扱い

### 本文

冒頭は「こんにちは、フリーランスエンジニアの太田雅昭です。」で始める。
一般的な口調を用いる（AGENT.mdより）。
未来の日付でも問題なし。

## ブランドカラー

`src/styles/global.css` の `:root` で定義。図版（SVG等）を作るときもこのパレットに合わせる。

- `--accent: #bb5537`（テラコッタ。メインアクセント）
- `--accent-dark: #8a000d`（深紅）
- ウォームグレー系: `#19120f`（black）/ `#3b2922`（gray-dark）/ `#f2f0ee`（gray-light）
- 図版での使い分け例: 主役ボックス＝テラコッタ、対比ボックス＝ウォームブラウン、ターミナル背景＝`#19120f` + 文字 `#f0b9a4`

## 進行中の計画

- **Zennfes Spring 2026 応募計画**: `docs/zennfes-spring-2026-plan.md` を参照。既存ブログ記事を優先度順に1日2本ペースでZenn化して応募する（締切 2026-06-26）。Zenn化作業を頼まれたらこのキューの上から進め、完了したらチェックボックスを更新する

## Zenn連携

GitHub連携済み（このリポジトリの `main` ブランチ）。`articles/*.md` がZenn記事として同期される。

### コマンド

- `bun run zenn:new` — 記事の雛形作成（スラッグ・frontmatter自動生成）
- `bun run zenn:preview` — localhost:8000 でZennの見た目をプレビュー

### frontmatter（Zenn形式。ブログとは別物）

```md
---
title: "タイトル"           # 【】プレフィックスは付けない（topicsが代替）
emoji: "🐳"
type: "tech"               # tech / idea
topics: ["docker", "macos"]
published: false           # trueで公開
---
```

### ルール・注意点

- ファイル名＝スラッグ（半角英数字・ハイフン・アンダースコア、12〜50字）
- **新規記事のファイル名は `YYYY-MM-` プレフィックス必須（2026-06決定）**。例: `2026-06-multilingual-voice-cloning-benchmark.md`。`articles/` が雑多になるのを防ぐため。**過去のプレフィックス無し記事はそのまま放置**（リネームは別記事化を招くため）
- 記事の同一性はスラッグで判定。**公開後にファイル名を変えると別記事として新規作成される**
- ファイルを削除してもZenn側の記事は消えない（ダッシュボードから手動削除）
- 冒頭の挨拶文（「こんにちは、フリーランス…」）はZenn版では入れない
- ブログ記事からの変換時、本文はそのまま・frontmatterと挨拶のみ調整
- **Zenn化する記事には構成図SVGを1枚以上作成する**（既公開記事と同様）。図解が活きるセクションが複数あれば複数枚作る。作成・挿入の手順は下記「画像」セクションの固定手順（ブログ先行確認→Zennにraw URL）に従う
- SEO: 同一記事をブログとZenn両方に置くと重複判定され、検索結果にはZenn側が出る（ブログ側が落ちる）。Zennはcanonical指定不可。これは許容する方針

### 画像

- Zennの `/images` ディレクトリは png / jpg / jpeg / gif / webp のみ（1ファイル3MB）。**SVG非対応**
- data URLのSVG・インライン`<svg>`・生`<img>`タグはZennのサニタイザーに弾かれる（検証済み）
- **外部URLのSVGは表示できる**（検証済み）
- **画像は既存規約どおり記事の隣に置く**（`src/content/posts/YYYY/MM-DD-名前.svg` 等。`public/images/` のような独自の置き場を作らない）
  - ブログ記事: 相対パスで参照 `![説明](./MM-DD-名前.svg)`
  - Zenn記事: 同じファイルを**raw URL**で参照
    `https://raw.githubusercontent.com/mohhh-ok/blog/main/src/content/posts/YYYY/MM-DD-名前.svg`
    （push直後から配信されるため、デプロイ待ちなしで普通にpushするだけでよい）
  - 実体1つ、修正1回で両方に反映。Zenn用画像のファイル名はASCIIにする（raw URLに使うため）
- **Zenn記事の画像にPagesのURL（mohhh-ok.github.io）を使わないこと（2026-06決定）**。Zennの外部画像はCloudinary（マルチCDN: Akamai/Fastly）でプロキシされ、Pagesデプロイ完了前（push後約2分）に記事を開くと404がエッジにキャッシュされて表示されなくなる事故が実際に起きた。raw URLならpush直後から200なのでこの問題自体が発生しない
- もしCloudinaryに失敗キャッシュが残ったら（curlで200なのにブラウザで404等）、**記事側の画像URLに `?v=N` を付けてキャッシュバスト**（新しい署名URLが生成され全エッジで再fetchされる。実証済み）
- 既存SVGの**内容を更新**したときも `?v=N` を上げる（raw側 max-age=300 と Cloudinaryキャッシュがあるため）
- SVGの目視確認は `@resvg/resvg-js` でPNG化できる。絵文字はtofu化するのでSVG内では使わない
- **図版は必ずブログ記事に先に適用する（2026-06決定）**。Zenn側のraw URL参照はpushするまで表示できず、ユーザーが事前確認できない。手順は固定: ① SVGを記事の隣に作成 → ② ブログ記事に相対パスで挿入 → ③ `bun run dev` のブログ側でユーザーが表示確認 → ④ 確認が取れてからZenn記事にraw URLで挿入 → ⑤ コミット・push。②③を飛ばしてZenn記事に先に入れない

### 音声・動画

- **Zennは `<audio>` `<video>` `<iframe>` などのHTMLタグを全部サニタイザーで除去する**（`<br>` 以外不可）。音声系プラットフォームの専用埋め込み記法（`@[soundcloud]`等）も無し。SoundCloud/Spotify/Apple Podcasts のURLを行頭に貼ってもカード化されない（2026-06調査）
- 結論: **Zennで音声インライン再生は不可能**。代替は「リンクで別タブ再生」が最も現実的
- 音声ファイルへのリンクは **`raw.githubusercontent.com` ではなく `cdn.jsdelivr.net/gh/` を使う（2026-06決定）**
  - 理由: `raw.githubusercontent.com` は `Content-Disposition: attachment` が付くためクリックで強制ダウンロードになる（Content-Type自体は `audio/mpeg` 等で正しい）。jsDelivr は `Content-Disposition` を付けないのでブラウザ内蔵プレイヤーで即再生される
  - URL変換: `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>` → `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>`
  - 制約: jsDelivrはpublicリポジトリのみ・1ファイル50MBまで・初回MISSはやや遅い（以降7日キャッシュ）
- ブログ記事側は `<audio>` で動くので raw URL のままでよい（`<audio src=>` 取得時は Content-Disposition は無視される）。**Zenn記事側だけ jsDelivr に置換する**
- 同様の制約から、Zenn記事に多数の音源を載せる際は「ブログ版に飛ばすほうがUX上は良い」ことを併記検討
