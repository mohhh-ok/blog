---
title: "【AI】OSS版Cloudflare OSをローカルで試す — Gadget生成・Gatekeeper自作・GA4連携まで"
pubDate: 2026-08-08
categories: ["AI"]
---

こんにちは、フリーランスエンジニアのmohです。

2026年8月にOSS化された([Apache 2.0](https://github.com/cloudflare/cloudflare-os/blob/main/LICENSE))Cloudflareの社内AIワークスペース「Cloudflare OS」を手元でクローンして触ってみました。ほぼAI任せで実装からテストまで行い、この記事もAIの書いたものを私が微修正しています。

`pnpm run-local` で起動するところから、ローカルLLMでのGadget生成失敗、本家のバグの1行パッチ、GA4連携用Gatekeeperの自作、E2E確認までの記録です。

## Cloudflare OS とは

README の自己紹介をそのまま要約すると、Cloudflare OSは次の3つを提供する「AI生産性のためのOS」です。

1. エージェントとのチャットUI
2. サンドボックス化されたアプリ開発 — チャットで作った小さな個人用アプリを「Gadget」と呼び、安全に共有できる
3. 「Gatekeeper」というセキュリティ基盤 — エージェントとGadgetの両方にガードレールをかけ、非技術者でも安全に使い倒せるようにする

Gadgetの設計思想が独特で、Google DocsのようなオフィススイートのアナロジーをAIアプリに拡張したもの、と説明されています。スライド資料を作ればそのユーザー専用のスライドアプリのインスタンスが1つ立ち上がり、他の誰のインスタンスとも隔離されます。気に入らない機能があればエージェントにコードを直接直させて構わない、という前提です。

Gatekeeperは「強化されたMCPサーバー」という位置付けです。外部サービスへのアクセスをすべて仲介し、認可(OAuthなど)、狭いスコープへの制限、全アクションのログ記録、副作用のあるアクションに対する人間の承認、を担当します。承認は同期的に止まる方式ではなく、Gatekeeperがローカルにシミュレートした結果をエージェントに返して先に進ませ、人間はあとでまとめて承認・却下できる設計になっている点が特徴です。

README には「本リポジトリはv2、v1で学んだことを踏まえた完全な書き直し」「非常に高機能だが、まだ荒削りな部分が多い。現時点ではearly accessとして捉えてほしい」ともあります。実際に触った結果もこの自己申告どおりでした(詳細は後述)。

## セットアップ

クイックスタートはこれだけです。

```
pnpm run-local
```

LLMのAPIキーは事前の `.env` 設定ではなく、起動後にアプリ内の「モデルを追加」モーダルへ貼り付けるBYOK方式です(Anthropic / OpenAI / Google / Cloudflare Workers AI / Ollama対応)。Ollamaは API URL に `http://localhost:11434` が自動入力され、API Tokenは空欄で通ります。

![Add AI Modelダイアログ。OllamaのModel IDにqwen2.5:14b-instructを入力、API URLはhttp://localhost:11434が自動入力済み](./08-08-cloudflare-os-addmodel.webp)

ローカル起動では、ユーザー名を `admin` にしてサインアップすると管理者権限が付きます(開発用に `ADMINS = ["admin"]` が注入されているため)。

## ローカルLLM(qwen2.5:14b)では力不足だった

まずAPIキー不要で試せるOllama(qwen2.5:14b-instruct)で読書ログアプリのGadget生成を頼みましたが、2回とも失敗。ツール呼び出しを正しく発行できず、ツール呼び出し風のJSONをチャット本文にテキストとして吐く典型的なtool-calling崩壊でした。プラットフォーム側は正常に動いており、単にモデルの力不足です。

同一プロンプトをClaude Sonnet 5に切り替えたら約35秒で `server.js` / `client.js` の書き込みまで完了($0.08)。生成コードも `this.ctx.storage.sql.exec` と実在のDurable Object SQLite APIを正しく使っていました。このハーネスをローカル14Bクラスで回すのは現実的でなく、BYOKでまともなモデルを繋ぐ前提です。

なお、この時点の「成功」はファイル書き込みまでの話で、生成されたアプリのフォーム送信はまだ動きません(次項)。

## 本家のバグを1行パッチする

生成された読書ログアプリのプレビューで、書名・評価・メモを入力して「追加する」を押しても一覧に反映されませんでした。ブラウザコンソールには次のエラーが出ます。

```
Blocked form submission to '' because the form's frame is sandboxed and the 'allow-forms' permission is not set.
```

生成コード側は `submit` ハンドラの先頭で `e.preventDefault()` を呼ぶ素直な実装で、原因はホスト側にありました。

`packages/workshop-frontend/src/GadgetUI.tsx` のGadgetプレビュー用iframe(`srcDoc`経由)の `sandbox` 属性に `allow-forms` が含まれていませんでした。

```diff
-        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
+        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
```

この1行で、生成コードを一切変えずにフォームが動くようになりました(リロード後のSQLite永続化も確認)。上流には未報告のissueです(2026-08-08時点)。

![パッチ後の読書ログGadget。書名「三体」を追加すると一覧に即反映される](./08-08-cloudflare-os-gadget-fixed.webp)

## 山場: GA4読み取り専用のGatekeeperを自作する

Cloudflare OSにはGoogle Analytics用のGatekeeperが標準では存在しません。試しにいきなり `fetch` させようとしても、GadgetやエージェントのWorkerは `globalOutbound: null` で外部通信そのものが遮断されていて、Gatekeeperを書く以外に外へ出る道がありません。公式の `write-gatekeeper` スキルの手順に沿って、GA4の読み取り専用Gatekeeperを新規に実装しました。

![Cloudflare OSのGatekeeperアーキテクチャ。エージェント/GadgetのWorkerは外部fetchが遮断され、Gatekeeperの3層(Vendor/Account/Session)だけがGA4への唯一の経路になる](./08-08-cloudflare-os-gatekeeper.svg)

### 認証方式: サービスアカウントJSON貼り付け + JWT Bearer

OAuth同意画面を用意する代わりに、既存の `gatekeeper-homeassistant` が採用している「URL+トークンを1テキストエリアに貼り付ける」パターンを踏襲し、サービスアカウントのJSONキーをそのまま貼り付ける方式にしました。OAuthの「Testing」ステータスだとリフレッシュトークンが約7日で失効する問題がありますが、サービスアカウントにはその概念自体がないため無人の定期実行と相性が良い、という判断です。

接続時のバリデーションは4段階です。

1. JSONをパースして `type` / `client_email` / `private_key` の存在確認 — 失敗ならハードエラー
2. `crypto.subtle.importKey("pkcs8", ...)` で秘密鍵としての妥当性を確認 — 失敗ならハードエラー
3. 実際に `oauth2.googleapis.com/token` へJWT Bearerでトークン交換を試行 — 失敗ならハードエラー
4. GA4 Admin APIの `accountSummaries` で閲覧可能なプロパティが0件でも、警告を出しつつ接続自体は完了させる(ソフト検証)

JWT署名(`jwt.ts`)はNode暗号ライブラリを使わず、Workers標準のWeb Crypto APIだけで実装しました(RS256、`crypto.subtle.sign`)。リポジトリ内にこのパターンの前例はなく新規実装です。

### Vendor / Account / Session の3層

- **Vendor**(状態なし): `connectAccount()` が `UserAccount` DOを新規発行し、nonce付き接続URLを返す。`createAccount()` はSA JSON貼り付けという明示的なユーザー操作が前提のため未実装
- **Account**: `UserAccount` DOが保存するのは `clientEmail` / `privateKeyPem` / `privateKeyId` / `projectId` のみで、貼り付けられたJSON全体は保存しない。`getAccountInfo()` は秘密鍵を一切返さず、鍵を扱うコードパスは `getAccessToken()` 内に閉じ込めた
- **Session**: 1インスタンス=1GA4プロパティに束縛したDO facetが `describe()` / `getMetadata()` / `runReport()` の3メソッドを提供し、すべて `authorizeObservation()` を経由する

読み取り専用なので、承認キューまわりの実装はかなり削れます。`applyAction` / `revertAction` は例外を投げるだけ、`rejectAction` はno-opです。ただし `authorizeObservation()` 自体は3メソッドすべてで省略できません。読み取りであっても権限チェックそのものは免除されない、という設計方針が明確でした。全プロパティが同一のサービスアカウント鍵を共有する構成のため、Observerによる個別検証は成立せず、この戦略は「no-op」を選びました。

### ハマったところ

- **`nodejs_als` フラグの付け忘れ**: 参照元にした `gatekeeper-email` の `wrangler.jsonc` にはあったこの互換フラグが新規パッケージで漏れていて、型チェックと`capnweb-validate`は正常終了するのに実行時だけ `Uncaught Error: No such module "node:async_hooks"` で起動に失敗しました。共有ライブラリがAsyncLocalStorageを使っていたのが原因で、モジュール解決はworkerd起動時にしか走らないため型チェックでは検出できません
- **`types.txt` はシンボリックリンク**: `src/types.d.ts` へのリンクであり、コピーではないことを `ls -l` で確認済み。新規Gatekeeperを作る際の既存の慣習でした
- **`wrangler types` の後処理**: 生成される `worker-configuration.d.ts` は `mainModule` が `.wrangler/validate/...` を指したままで、リポジトリの `scripts/generate-worker-types.mjs` が行うバナー正規化とパス書き換えを手動で再現する必要があった(このスクリプトは全パッケージ一括再生成用で、新規パッケージ単体には使えない)
- **型の二重定義**: 新規実装した `jwt.ts` が `MintedAccessToken` 型を独自定義しており、コピー元の `auth-retry.ts` にある同名・同形状の型と重複していた。構造的型付けなので `tsc` は通っていたが、source of truthが2箇所に分裂していたため `auth-retry.ts` からimportする形に統一した

## E2E: GA4レポートGadgetが動くまで

`/gatekeepers` の一覧に自作の「Google Analytics」が自動で現れ、サービスアカウントJSONを貼るだけで接続完了します。続けてチャットに次のプロンプトを送信しました(実際のプロパティ名・IDはここでは伏せます)。

> Google Analyticsのプロパティ「(プロパティ名)」に接続して、週次アクセスレポートのGadgetを作って。期間セレクタ(開始日・終了日)つきで、日別のactiveUsersとscreenPageViewsの推移テーブルと合計を表示して。初期表示期間は2025-10-01〜2025-10-31にして

エージェントは勝手にデータへアクセスできず、まず接続承認カード(Deny / Set up)を出してきます。「Set up」からアカウント選択 → configurator UI(Gatekeeper側が提供するiframe)でプロパティ選択、と進むと、バインディング名(`GA_PROPERTY`)が自動導出されてGadgetに配線されます。生成は承認操作込みで約3分、$0.12でした。

![生成された週次アクセスレポートGadget。2025-10の日別activeUsers/screenPageViewsテーブルと期間合計を表示](./08-08-cloudflare-os-ga4-report.webp)

データのある期間は日別テーブルと合計が正しく表示され、データが存在しない期間に切り替えるとクラッシュせず「データがありません」という明示的な空状態になりました。

## 粗削りな点: 定期実行(Scheduler)には辿り着けなかった

「このレポートを毎週月曜9時JSTに自動更新して投稿して」と依頼しましたが、ローカル環境ではスケジュールを登録できませんでした。ブロッカーは3つです。

- Durable Objectの `ctx.storage.setAlarm()` はローカルでは `alarms are not yet implemented for SQLite-backed Durable Objects` で失敗する(本番Cloudflareでの挙動は未検証)
- 同梱の scheduler(Scheduled Tasks)Gatekeeperが、エージェントから見えるvendor一覧に含まれていない(自作した `analytics` は自動で出てくるのと対照的)
- `/gatekeepers` 画面から手動で接続はできるが、URLで指定する個別リソースを持たないシングルトン設計のためか、Gadgetへバインドする経路がUIにもエージェントの `env` にも現れない

ソースコード(`packages/gatekeeper-scheduler/src/scheduler.ts`)を読む限り、スケジュール登録の書き込み系メソッドは承認キューを正しく経由する設計で、「読み取りは即時・書き込みは承認待ち」という方針自体は守られています。ただ今回はその手前に到達できませんでした。READMEの「荒削り、early access」という自己申告どおりの箇所です。

## まとめ

サンドボックスの1行パッチとGA4 Gatekeeperの自作は、どちらも半日〜1日程度の作業（AIによる誇張表現で、実際はそれほどかかっていません）で完走できました。Capability-based securityとCap'n Web RPC、Dynamic Worker Facetを実プロダクトの形で見られる点は、Cloudflare Workers上でエージェント基盤を作ろうとしている人には参考になると思います。

定期実行のようにまだ配線が繋がりきっていない機能もあるので、README通り「early access」として触るのが妥当です。Gatekeeperの自作フローが一通り機能することは確認できたので、自社の内部ツールに繋ぎたいサービスが決まっている人には試す価値があります。
