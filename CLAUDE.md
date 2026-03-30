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
