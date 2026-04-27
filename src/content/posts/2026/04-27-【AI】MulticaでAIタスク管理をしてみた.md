---
title: 【AI】MulticaでAIタスク管理をしてみた
pubDate: 2026-04-27
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Multica

MulticaはAIエージェントをまるでチームメイトのようにしてくれます。issueなどのタスクボードを人間とAIエージェントと共同で管理・消費することが可能となります。SKILLの自動更新も備えており、一度完了したタスクは次回からスムーズに消化できるようになります。

https://github.com/multica-ai/multica


### 機能

- **Agents as Teammates** — エージェントをチームメイトのようにアサインできます。プロフィールを持ち、ボードに登場し、コメントを投稿し、issueを作成し、ブロッカーをプロアクティブに報告します。
- **Autonomous Execution** — タスクのライフサイクル全体（enqueue / claim / start / complete / fail）を管理し、WebSocketによりリアルタイムで進捗をストリーミングします。
- **Reusable Skills** — 一度実装した解決策は再利用可能なSkillとしてチーム全体に蓄積されます。デプロイ・マイグレーション・コードレビューなど、チームの能力が時間とともに積み上がっていきます。
- **Unified Runtimes** — ローカルデーモンとクラウドランタイムを単一のダッシュボードで一元管理。利用可能なCLIを自動検出し、リアルタイムでモニタリングできます。
- **Multi-Workspace** — チームごとにワークスペースを分離して管理可能。各ワークスペースは独自のエージェント・issue・設定を持ちます。

### Claude Managed Agentsとの比較

Claude Managed Agentsと非常に似た特徴も持っています。

|                          | Claude Managed Agents | Multica                       |
| ------------------------ | --------------------- | ----------------------------- |
| エージェントの定義・再利用       | ○                     | ○ (Skills)                    |
| 長時間タスクの実行           | ○ (Anthropicクラウド)    | ○ (ローカルデーモン)              |
| セッション管理               | ○                     | ○                             |
| 複数モデル対応               | Claudeのみ             | Claude/Codex/Gemini など       |
| 実行場所                   | Anthropic のクラウド     | あなたのマシン or 自前サーバー    |
| チームコラボUI (issue board) | ×                     | ○                             |


## 環境構築

Windowsでも使え、セルフホストも可能です。今回はMacOS CLI、クラウド前提で構築していきます。

```sh
brew install multica-ai/tap/multica
multica setup
```

ログインします。

```sh
multica login
```

ランタイムを起動します。

```sh
multica daemon start
```

バックグラウンドで起動しました。これはポーリングで通信しており、Goバイナリで軽く、基本的には動かしっぱなしで良いそうです。（用途による）

止める時は以下のコマンドを打ちます。

```sh
multica daemon stop
```

## 使ってみる

デスクトップアプリもありますが、Electronなのでメモリが気になる私はWeb UIで行うことにしました。以降、Web UIで作業していきます。

### Runtimes確認

先ほどローカルでdaemon起動した時に、ランタイムが自動で登録されています。daemonを止めても残っていたため、デバイスごとに残しているようです。私の場合はCursor, Claude Code, Codexが登録されていました。インストール状況を見て、自動で登録してくれるようです。

### Agents作成

エージェントを作成します。「Local Claude Code」として、自分のマシンのClaude Codeを登録しまいた。TeammateとPrivateと選べるため、チームで使う場合の選択肢が広がります。

作成後、以下の情報も登録できるようになります。

- **Instructions**: システムプロンプト
- **Custom Env**: CLIプロセスに注入する環境変数（`ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USE_BEDROCK` など）
- **Custom Args**: CLI起動時の追加引数（`--model`, `--thinking` など）
- **Skills**: ワークスペースのSkill

### issue作成

Issueは以下のステータスがあります。

- Backlog: 蓄積
- Todo: 実行待ち
- In Progress: 実行中
- In Review: レビュー待ち
- Done: 完了

AsigneeにさきほどのLocal Claude Codeを指定し、以下のissueを作成しました。

```sh
Say hello
```

すぐにClaud Codeがissueのステータスを変更し、しばらく経ったあと「hello」と返事をした後、issueはIn Reviewに移されました。

## 調査

ローカルのClaude Codeはどこで実行されいるのでしょう。以下のissueを投げてみました。

```
Show me pwd
```

pwdは現在のディレクトリを表示するコマンドです。結果は以下の通りとなりました。

```
/Users/masaaki/multica_workspaces/10ecbf59-dd7a-4068-b94a-a0c1d23fea30/e427aa83/workdir
```

これは agent + issue でUniqueとなるそうです。

他ディレクトリも読めるでしょうか。以下のissueを投げてみます。

```
Move to User Directory. And show me pwd.
```

結果は以下のようになりました。

```
Moved to user directory. pwd output: /Users/masaaki

Note: Shell state (including cwd) does not persist between commands in this environment, so the working directory was reset back to the workdir after the command.
```

初期ディレクトリからユーザーディレクトリに移動できています。コマンドを一行で実行したらしくClaude CodeのNoteが出ていますが、実用上は問題ないかと思います。

## セキュリティリスク

初期ディレクトリ以外でも作業できることが確認できましたが、これは見方を変えるとセキュリティリスクになり得ます。AIが暴走した時などはローカルデータ消失、最も恐ろしいのはローカルにある秘密情報でGithubリポジトリや諸々を破壊されるといったことも考えられます。

**ローカル運用はお勧めしません。**

## ローカル以外で実行する

Multicaのアーキテクチャは「サーバー（issueボード）」と「daemon（agent実行環境）」が分離しており、危険なのは後者です。daemonをメインマシン以外で動かす選択肢を整理しました。

| 選択肢                              | 隔離度 | 手間 | コメント                                                |
| ----------------------------------- | ------ | ---- | ------------------------------------------------------- |
| 自分のメインMac                     | 最低   | 0    | 秘密情報すべてに到達できる              |
| 専用ユーザー（同マシン）            | 低     | 小   | macOSの別ユーザーでdaemon起動。ホームディレクトリを分離 |
| Docker / コンテナ                   | 中     | 中   | daemon＋CLIをコンテナ化。ホストFSはマウント分のみ       |
| 専用マシン（古いMac miniなど）      | 高     | 中   | ハードウェア隔離。秘密情報を一切置かない                |
| クラウドVM（EC2 / Hetzner など）    | 高     | 中   | Linux VMにdaemonを入れる。壊れても再作成可能            |
| Kubernetes (agent-sandbox)          | 最高   | 大   | Pod単位で完全隔離。チーム運用向け                       |

### Providerによる区別

Providerにより保護のレベルも変わります。

- **Claude Code**: ファイルシステムサンドボックスなし（OS権限に依存）
- **Codex**: バージョン依存の独自サンドボックスあり（Multica公式ドキュメントにも言及）
- **Cursor Agent / Gemini など**: 各CLIの実装次第

### 当面の解決方法

- HetznerやVultrで月数百円のLinux VMを借り、そこに`multica daemon start`。鍵類は一切置かず、PRだけ作らせてマージは人間がGitHubでやる
- Docker / Kubernetesでdaemon＋CLIをコンテナ化し、ボリュームを限定マウント
- 「issueに書く内容 ＝ そのVMでやって良いこと」と割り切る


## 用途を考える。

たとえば以下のような使用方法が考えられます。

### 完全に自分専用

完全に自分専用なら最もシンプルです。好きなディレクトリを指定して、そこで様々なタスクを実行することができます。

### チームで運用

チームだと毛色が変わってきます。ワーキングディレクトリに毎回データを持ってくる必要があります。たとえば毎回git cloneしてコード修正、PRを出す、などといった使い方が想定されます。

なお**チーム運用でローカル実行するのは最も危険です**

### 役割特化エージェントの並走

公式やレビュー記事でよく挙げられているのが、役割を分けた複数エージェントを同時に走らせる構成です。たとえば「Frontend Agent」「Backend Agent」「Security Agent」「QA Agent」をそれぞれ別のInstructions・Skillで作成し、issueのラベルやAssigneeで振り分けます。1人で開発していても担当を分けるだけでSkillが混ざらず、精度が安定します。

### 長時間タスクの放流

リファクタリング、依存ライブラリの一括アップデート、テスト追加、ドキュメント整備など「やった方がいいけど後回しになる作業」をissueに溜めておき、空き時間にまとめてアサインする使い方です。人が触らない夜間や週末にAIが進めてくれます。

### 定期運用（Autopilot）

cron的なトリガーでissueを自動生成・自動アサインするAutopilot機能があり、以下のような運用に使えます。

- 毎朝、未対応issueを集めてトリアージ
- 毎週月曜、依存パッケージの脆弱性チェックとPR作成
- PRが立つたびに別のエージェントが自動レビュー
- 定時バックアップ・ヘルスチェック・レポート生成

### ナレッジ蓄積基盤としての利用

タスクをこなすほどSkillが増えていくため、属人化しがちな「デプロイ手順」「マイグレーションのお作法」「障害対応Runbook」などをエージェントに教え込むと、チーム全体の共有資産になります。新メンバーが入ったときも、エージェントが同じSkillで動くため立ち上がりが早くなります。

## まとめ

とても便利と思ってMulticaを試してみましたが、使用するにはまだ勇気がいりそうです。個人プロジェクトで、かつ別PCで動かすなら問題ないかもしれません。最近はAIによる実験的なプロジェクト（実店舗をAIに運営させるなど）が出てますので、そういうのだとマッチしそうです。
