---
title: 【AI】ClaudeCodeの並列実行PlanModeでタスク管理させる
pubDate: 2026-03-03
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Claude Codeの並列実行

Claude Codeの並列実行を行うことで、開発スピードが格段に上昇します。いくつか方法があります。

worktreeはローカルのnodeモジュールや設定ファイルが引き継がれず環境構築が必要になるケースがあり、tmuxはUI自体が使いにくくオーケストレーションの管理が煩雑になりがちです。
 
## そもそもの問題

並列実行が使いにくい原因の一つに、PlanModeがあります。以下のような場合

- タスクをとりあえずメモしておく
- それを並列で消化していく

といったケースの場合、並列実行したPlanModeでは、それぞれのタスクが被ってしまう可能性があります。PlanModeはファイル操作ができず、状態共有の手段がないためです。

## PlanModeでもcurlのGETは使える

curlのGET系は使えるため、サーバーを立ててGETで副作用を持たせることでこれを解決できます。なおWebFetchはlocalhostに使用できないため、curlでAPIを叩かせます。以下のようなプロンプトでサーバーを作り、目的を達成できました。

````md
# Claude Code マルチエージェント タスクサーバー実装

## 背景・課題
- Claude Codeで並列エージェント実行時のアトミックなタスク管理手段がない
- Taskツール（TaskCreate/TaskUpdate）はセッション内限定で永続化されない

## 解決
**WebFetchのGETリクエストに副作用を持たせる**ことで、plan modeのワーカーCCも含めた全インスタンスがタスクの読み書きをできる。

```
ワーカーCC → GET /tasks/next   （タスク取得）
ワーカーCC → GET /tasks/claim  （担当登録）
ワーカーCC → GET /tasks/done   （完了通知）
```

## アーキテクチャ
- **pull型**: ワーカーが自律的にタスクを取りに行く
- **HTTPサーバーがアトミック性を担保**

## 実装仕様
- パッケージマネージャー: pnpm
- スタック: TypeScript + Hono + Node.js + SQLite
- パッケージは最新版を使用するためinstallコマンドで入れる
- ポート: 2999

```json
"pnpm": {
  "onlyBuiltDependencies": ["better-sqlite3"]
},
```

## エンドポイント（全てGET）
```
GET /tasks          一覧取得
GET /tasks/next     次の未割当タスク取得
GET /tasks/add      タスク追加（?title=&description=）
GET /tasks/claim    担当登録（?id=&agent=）
GET /tasks/done     完了マーク（?id=）
GET /tasks/reset    pendingに戻す（?id=）
GET /tasks/status   進捗サマリー
```

## 作成場所
`./agent-task-server/`

## 設定ファイル

以下の設定ファイルを保存

./agent-task-server/config.json
```json
{ port: 2999 }
```

## SKILLファイル

以下のSKILLファイルを保存し、ユーザーの利便性に役立てる。保存箇所はプロジェクトディレクトリを起点とする。

./.claude/skills/agent-task-server/SKILL.md
```md
---
name: agent-task-server
description: >
  Use this skill when operating as a worker agent that needs to autonomously
  pick up tasks, claim ownership, and report completion via the agent task server
  running at http://localhost:2999. Triggered automatically when working in
  multi-agent mode, or when phrases like "次のタスクを取る", "タスクを担当する",
  "タスクを完了にする", "pull next task", "claim task", "mark done",
  "task server", "マルチエージェント作業" appear.
---

Claude Code用のタスク管理サーバー。GETで操作するためplan mode中も使用可能。curl使用。

1. 基本ワークフロー（必ず順守）
GET /tasks/next          → 次の pending タスク確認
GET /tasks/claim?id=&agent=  → 自分の名前で担当登録（失敗=競合→再度 next へ）
（作業実施）
GET /tasks/done?id=      → 完了マーク

2. agent 名の付け方: オーケストレーターなしの純粋 pull 型。ワーカーは作業開始時に
worker-{ランダム6文字} 形式のIDを自己生成し、セッション中一貫して使う

3. 競合時の処理: claim が {"error": "already claimed"} を返したら、再び /tasks/next を叩く

4. 作業前の確認: /tasks/status でサマリーを確認してから開始

## エンドポイント（全てGET）
GET /tasks          一覧取得
GET /tasks/next     次の未割当タスク取得
GET /tasks/add      タスク追加（?title=&description=）
GET /tasks/claim    担当登録（?id=&agent=）
GET /tasks/done     完了マーク（?id=）
GET /tasks/reset    pendingに戻す（?id=）
GET /tasks/status   進捗サマリー
```
````


## セットアップ

1. 上記プロンプトをClaude Codeに渡してサーバーを構築
2. サーバーを起動: `cd agent-task-server && pnpm start`
3. スキルが `.claude/skills/agent-task-server/SKILL.md` に生成される
4. 別ウィンドウのClaude Codeから `/agent-task-server` で呼び出せる


## 使ってみる

以下のようにして使います。PlanModeでも使えます。

```
/agent-task-server タスクXXを追加して
/agent-task-server タスクYYを追加して
/agent-task-server タスクZZを追加して
```

のようにタスクを追加します。実行するには下記のように単に呼び出せばOKです。

```
/agent-task-server
```

複数のClaude Codeウィンドウを開き、それぞれで /agent-task-server を実行すると、各インスタンスが /tasks/next → /tasks/claim → /tasks/doneの順でタスクを消化していきます。HTTPサーバーがアトミック性を担保するため、同じタスクを2つのインスタンスが取り合うことがなくなります。
 
 
これで複数Claude Codeインスタンスでタスクをアトミックに処理できるようになりました。
