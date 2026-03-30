---
title: "【Claude Code】freee-mcpで請求書作成してみた"
pubDate: 2026-03-30
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## freee請求書の作成を自動化したい
フリーランスだと、請求書発行はわりと頻繁に行います。事務作業を行なってくれる方がいれば良いのですが、それほど潤沢にお金があるわけではありません。確定申告も自分で行なっています。そのような状況で、freee-mcpがあることを知りました。これは使わざるを得ない、早速やってみました。普段Claude Codeを使っているので、それで進めていきます。

## MCPサーバーとスキルの追加
freee-mcpのリポジトリはこちらです。

https://github.com/freee/freee-mcp

これによると、名前とURLを使えば良いようです。早速Claude Codeに聞いてみると、claude mcp addコマンドでできることがわかりました。

claude mcp addコマンドは下記で説明されています。

https://code.claude.com/docs/ja/mcp

ひとまずグローバルで使用したいので、以下のコマンドを使用しました。

```bash
claude mcp add --transport http freee --scope user https://mcp.freee.co.jp/mcp
```

また、freee用のskillも以下のコマンドでインストールしました。こちらもグローバルに入れています。

```bash
npx skills add -g freee/freee-mcp
```

## 認証
インストール後、`/mcp`コマンドからfreeeを選択して認証を行いました。ブラウザ認証ですので、Google accountでさっと進めることができました。

## 動作確認

### 事前チェック
念の為Claude Codeを再起動して聞いてみます。

```
freee mcpの使用方法は把握できてる？
```

```
⏺ freee MCPのツールは確認できています。利用可能なツールは以下の通りです：

  認証・設定系
  - freee_authenticate - 認証
  - freee_auth_status - 認証状態確認
  - freee_clear_auth - 認証クリア
  - freee_current_user - 現在のユーザー情報
  - freee_server_info - サーバー情報
  - freee_list_companies - 事業所一覧
  - freee_get_current_company / freee_set_current_company - 現在の事業所取得・設定

  API操作系
  - freee_api_get - GET
  - freee_api_post - POST
  - freee_api_put - PUT
  - freee_api_patch - PATCH
  - freee_api_delete - DELETE
  - freee_api_list_paths - 利用可能なAPIパス一覧

  会計・人事労務・請求書・工数管理・販売APIに対応しています。

  より詳細なAPIリファレンスが必要な場合は freee-api-skill
  スキルも利用できます。何か具体的にやりたい操作はありますか？
```

いけそうですね。早速請求書作成をしてみます。

### 請求書を作成してみる

```
請求書を作成したい。必要な情報を対話形式で聞いて
```

するとAPIを使用した調査が始まりました。ここは思ったより時間がかかった印象です。事業所情報、取引先リストなどを取得していたようです。

その後以下の項目について聞かれました。

1. **請求先** - freeeに登録済みの取引先がリストで表示され、選択する形式
2. **明細** - 品目や金額などの請求内容
3. **請求日と支払い期限**

すべて回答すると、APIで請求書が作成されました。freeeのWeb画面で確認したところ、請求書が問題なく作成されていました。

### PDFダウンロード（非対応）
続いてPDFダウンロードをお願いしてみましたが、これは断られました。PDFダウンロード用のエンドポイントが用意されていないとのことです。

Playwrightを使えばWeb画面からダウンロードできるかもしれませんが、今回はやめておきました。

## まとめ
もっとサクッと請求書が作れると思っていましたが、思ったより面倒だったなという印象です。とくに最初のデータ読み込みで案外時間がかかるのと、PDFダウンロードが不可という部分です。PDFダウンロードができないと、取引先へ自動送信なども行えないですね。

今後自動化をがっつりやろうと思うとClaude Codeだけではなく、専用のスクリプトを作る必要があるかもしれません。
