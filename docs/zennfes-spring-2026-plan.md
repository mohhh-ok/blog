# Zennfes Spring 2026 応募計画

調査日: 2026-06-07 / **締切: 2026-06-26（金）**

## 前提・ルール（調査済みの事実）

- 応募方法: Zennで記事を公開 → 記事ページ上部の「コンテストに応募する」ボタン（**手動操作。ユーザーが行う**）
- 1記事につき1テーマ（1記事を複数テーマに重複応募は不可）
- 同一テーマへの複数記事応募を禁じる記述はなし
- TiDBコンテストは「TiDB Cloud / mem0 を利用していると加点ですが、必須ではありません」と明記
- **Zennは1日2記事までの公開制限**があるため、Zenn化は1日2本ペースで数日に分けて進める
- 応募状況（6/7時点）: 春テーマ355件 / AmiVoice 28件 / TiDB 27件 / YouCam 9件

## 応募済み

- [x] `articles/claude-autonomous-story-simulator.md`（物語サイト）→「この春、始めたこと」**応募済み**

## Zenn化キュー（優先度順・1日2本）

上から順に、1日2本ずつZenn化 → 公開 → ユーザーが応募ボタンを押す。

### Day 1 — TiDB枠（期待値最良: 競争27件×賞4本）

- [ ] **P1**: `src/content/posts/2026/04-05-【AI】画像とテキストのEmbeddingで最適なモデルを探る【2026年4月】.md`
  - 出し先: **TiDB**（zennfes-spring-2026-tidb）
  - スラッグ案: `image-text-embedding-models-2026`
  - 調整: 冒頭に「RAG用途のEmbeddingモデル選定」という位置づけの一文を追加（本文はそのまま）
- [ ] **P2**: `src/content/posts/2025/04-24-【ai】postgres-+-drizzle-+-embeddingで意味検索する.md`
  - 出し先: **TiDB**
  - スラッグ案: `postgres-drizzle-semantic-search`
  - 調整: 同上（RAG実装知見としての位置づけを冒頭で明示）

### Day 2 — 春テーマ・上位

- ~~**P3**: `02-26-【AI】ClaudeCodeでコードをほとんど書かなくなった話.md`~~ **対象外（2026-06-07決定）**: モデル・機能の記述が古くなっているためZenn化しない（作成済みのPlan Mode構成図SVGはブログ側にのみ残す）
- [ ] **P4**: `src/content/posts/2026/04-27-【AI】MulticaでAIタスク管理をしてみた.md` + `04-28-【Multica】GCEにランタイムを構築してみた.md` **の2本を1本に統合**
  - 出し先: **この春、始めたこと**
  - スラッグ案: `multica-ai-task-management`

### Day 3 — 春テーマ・中位

- [ ] **P5**: `src/content/posts/2026/04-09-【Anthropic】Managed Agentsを試してみた.md`
  - 出し先: **この春、始めたこと**
  - スラッグ案: `anthropic-managed-agents-hands-on`
- [ ] **P6**: `src/content/posts/2026/03-30-【Claude Code】freee-mcpで請求書作成してみた.md`
  - 出し先: **この春、始めたこと**
  - スラッグ案: `freee-mcp-invoice-creation`

### Day 4 — 春テーマ・余力があれば

- [ ] **P7**: `src/content/posts/2026/03-21-【Security】GitLeaksからBetterLeaksに乗り換えた話.md`
  - 出し先: **この春、始めたこと**
  - スラッグ案: `gitleaks-to-betterleaks`
- [ ] **P8**: `src/content/posts/2026/03-21-【ClaudeCode】PC閉じてても自動実行がすごすぎる【リモートタスク】.md`
  - 出し先: **この春、始めたこと**
  - スラッグ案: `claude-code-remote-tasks`
  - 注: 応募済みの物語サイト記事とネタが近いため最低優先

## Zenn化の手順（毎回共通）

CLAUDE.md「Zenn連携」のルールに従う。要点:

1. `articles/<スラッグ>.md` を作成（スラッグはASCII・12〜50字。**公開後に変更不可**）
2. frontmatterをZenn形式に変換（【】プレフィックスは外しtopicsで代替）
3. 冒頭の挨拶文「こんにちは、フリーランス…」を除去。本文はそのまま
4. 構成図SVGを1枚以上作成する（CLAUDE.md「Zenn連携」のルールおよび「画像」の固定手順に従う）
5. `published: true` でコミット・push（**1日2本まで**）
6. 公開を確認したら、ユーザーが該当コンテストの応募ボタンを押す
7. このファイルのチェックボックスを更新する

## 見送り

- **AmiVoice**（音声認識×生成AI必須）/ **YouCam**（美容API）: 該当する既存記事なし。新規実装が前提のため今回は見送り
