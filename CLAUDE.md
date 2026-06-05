# ブログプロジェクト

Astro製の技術ブログ。GitHub Pagesにデプロイ。

## コマンド

- パッケージマネージャ: **bun**（`bun install`, `bun run dev` など）
- `bun run dev` — 開発サーバー起動
- `bun run build` — ビルド
- `bun run check` — 型チェック

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
- 記事の同一性はスラッグで判定。**公開後にファイル名を変えると別記事として新規作成される**
- ファイルを削除してもZenn側の記事は消えない（ダッシュボードから手動削除）
- 冒頭の挨拶文（「こんにちは、フリーランス…」）はZenn版では入れない
- ブログ記事からの変換時、本文はそのまま・frontmatterと挨拶のみ調整
- SEO: 同一記事をブログとZenn両方に置くと重複判定され、検索結果にはZenn側が出る（ブログ側が落ちる）。Zennはcanonical指定不可。これは許容する方針

### 画像

- Zennの `/images` ディレクトリは png / jpg / jpeg / gif / webp のみ（1ファイル3MB）。**SVG非対応**
- data URLのSVG・インライン`<svg>`・生`<img>`タグはZennのサニタイザーに弾かれる（検証済み）
- **外部URLのSVGは表示できる**（検証済み）→ SVGは `public/images/zenn/` に置き、
  - Zenn記事: `https://mohhh-ok.github.io/blog/images/zenn/xxx.svg`（絶対URL）
  - ブログ記事: `/blog/images/zenn/xxx.svg`（base付きパス）
  で同じファイルを参照する（実体1つ、修正1回で両方に反映）
- 公開順序: 画像を含むpushが先 → GitHub Pagesのデプロイ完了後に `published: true`（先に公開すると画像が一瞬404）
- SVGの目視確認は `@resvg/resvg-js` でPNG化できる。絵文字はtofu化するのでSVG内では使わない
