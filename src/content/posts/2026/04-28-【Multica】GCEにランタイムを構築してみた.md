---
title: 【Multica】GCEにランタイムを構築してみた
pubDate: 2026-04-28
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Multica

Multicaはタスクボードで扱えるAIエージェントと人間とのコラボツールです。以前にご紹介させていただきました。

https://mohhh-ok.github.io/blog/posts/2026/04-27-aimultica%E3%81%A7ai%E3%82%BF%E3%82%B9%E3%82%AF%E7%AE%A1%E7%90%86%E3%82%92%E3%81%97%E3%81%A6%E3%81%BF%E3%81%9F/

今回は、その続きです。

## セキュリティ問題

Multicaはエージェントランタイムにローカルを選択できます。しかしローカルマシンで動かすとAIが暴走した時に怖いため、対策を考えます。今回はGoogle CloudのGCEをランタイムとして構築してみました。

## GCE

### GCEの構成

ひとまず無料枠で試してみました。

- name: claude-code-runtime
- machine-type: e2-micro
- region/zone: us-central1-a（無料枠中で最安定・低レイテンシ）
- image: ubuntu-2404-lts
- disk: pd-standard 30GB
- network tag: なし（multica daemonが外向き通信するだけならingress不要。ホスティングするなら別途解放）

### GCEの構築

AIに任せれば大丈夫です。このブログを読み込ませるだけでいけると思います。なお`gcloud`コマンドはインストールしておいてください。

手順（AIができる）
- Google Cloudにプロジェクトを作成
- Compute Engineインスタンスを作成
- Swapを4GBに設定（Memoryが少ない場合。多ければ不要）
- Node.js 22 LTS インストール
- Claude Code インストール
- Multica インストール

手順（手動）
- https://multica.ai の設定からAPIトークン発行
- sshでCompute Engineに入る（AIがコマンドを教えてくれる）
- `claude`実行。ローカルでURLを開き、ターミナルにコードを貼り付ける
- `multica login --token`でAPIトークンを貼り付ける
- `multica daemon start`を実行
- Multicaのページに追加されるので、それを用いてAgent作成

なお常に起動させておきたいので、AIに

```
GCEでMulticaをsystemdのサービスとして登録。envは自由に設定できるように
```

と投げておくとベターです。

## Reactページをホストさせてみる

色々考えたのですが、ひとまず失敗しなさそうなのを選びました。クライアントオンリーページをホストさせてみます。

### ポートを開ける

まずは80/443ポートを開ける必要があります。ローカルのAIで

```
先ほど作ったGCEの80,443ポートを開いて
```

と投げます。これで公開準備が整いました。

### 権限を渡す

VM内なので、Claude Codeに全権限を渡します。ローカルのAIに指示します。

```
Claude Codeのsettings.json に defaultMode: "bypassPermissions"を追加して。
```

これでClaude CodeがVM内で無双状態となります。APIキーなどを渡す時は十分気をつけてください。

### 世界時計を作らせる

Multicaでissueを投げます。assigneeはGCEのを指定します。

```
Vite + React + TypeScriptで世界時計を配信して。

- ディレクトリ: ~/world-watch にプロジェクト作成
- ポート: 80（外部公開）
- 配信元: ビルドした ~/world-watch/dist の中身を /var/www/html/ に rsync で配置
  （Caddyに home ディレクトリを直接読ませない）
- Caddy: apt で公式リポジトリからインストール、/etc/caddy/Caddyfile を以下に書き換え:
    :80 {
      root * /var/www/html
      encode gzip
      try_files {path} /index.html
      file_server
    }
- /var/www/html を caddy:caddy 所有・755
- sudo systemctl enable --now caddy で起動

確認:
- curl -sI http://localhost/ が 200
- 外部IPに curl して 200:
    EXT=$(curl -sH "Metadata-Flavor: Google" \
      http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
    curl -sI http://$EXT/

失敗したら journalctl -u caddy で原因確認・修正。
完了時に外部URLを返答に書く。
```

### 結果

無事に世界時計が配信されました。感動です。

## まとめ

今回、ローカルではなくGCEをランタイムとすることで、安全にMulticaを使用することができました。これならチーム運用にも耐えれそうです。

ただしGitHubや色々連携することになると思うので、APIキーの危険性はまだあります。特にPermissionを迂回しているためAIの暴走に気づけないです。そこはトレードオフになりそうです。

こうした用途のためにGitHubの別アカウントを作るのも手かもしれません。別サービスも同様ですね。（Slack Botとか程度なら問題ないと思われるが）
