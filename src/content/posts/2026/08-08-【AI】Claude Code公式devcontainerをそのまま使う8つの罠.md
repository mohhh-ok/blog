---
title: "【AI】Claude Code公式devcontainerをそのまま使う8つの罠"
pubDate: 2026-08-08
categories: ["AI"]
---

こんにちは、フリーランスエンジニアのmohです。

AIエージェントによるディスク消去や本番DB消去などの話はよく聞きます。しかし情報が良く分からないこともあります。たとえばClaude CodeならAuto Mode Classifierは有効だったかどうかなどです。これがはっきりしないと、どうも対策を練りようがありません。

しかし備えに越したことはないということで、今回devcontainerに隔離する方法を試してみることにしました。この記事はAIに構築させ、AIに記事を書かせています。

## 概要

エージェントに任せる作業が増えてきたので、安全確保のために Claude Code を dev container に隔離してみました。ベースにした公式リファレンスの `.devcontainer` は、事故範囲の限定に加えて `--dangerously-skip-permissions`(全許可の無人運転)を安全に回すことを狙った firewall 付きの構成です。これを macOS で組んだのですが、結論から言うと、公式の `.devcontainer` と公式 feature をそのまま使うと現時点では起動すら通りません。動くまでに罠を8つ踏んだので、ログ付きで全部記録します。作業と本記事の下書きは Claude Code 自身にやらせ、私が確認・修正しています。

最終形のファイル一式は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/08-08-claude-code-devcontainer) に置きました。

## 作ったもの

- コードはホストと bind mount で共有しつつ、エージェントの事故範囲(誤削除・誤コマンド)をコンテナ内に限定する
- egress firewall(公式の `init-firewall.sh`)で通信先を allowlist 方式に制限する
- VS Code は使わず [devcontainer CLI](https://github.com/devcontainers/cli) で完結させる

![構成図。macOSホストとdev containerをbind mountで接続し、node_modules・.pnpm-store・~/.claudeをnamed volumeで分離、出口にegress firewall。罠1〜8の発生位置を注記](./08-08-claude-devcontainer-architecture.svg)

日常の操作は2コマンドです。

```sh
pnpm dlx @devcontainers/cli up --workspace-folder .
pnpm dlx @devcontainers/cli exec --workspace-folder . claude
```

`devcontainer.json` は Docker が直接解釈するものではなく、feature の解決や lifecycle フック(postCreate / postStart)を実行するクライアントが別に必要です。VS Code 拡張はそのクライアントの1つにすぎず、CLI だけで全部できます。

先に前提をひとつ。bind mount がある限り「コンテナに閉じ込めたから何をさせても安全」は成立しません。ワークスペースへの書き込みはホストに反映されるので、`devcontainer.json` 自体の書き換えや、ホスト側で実行されるもの(git hooks、ビルド成果物)経由の実質的な脱出は防げません。公式ドキュメントが「trusted repositories でのみ使え」と警告しているのはこのためです。用途は「自分のリポジトリで事故範囲を限定する」までです。

firewall 側にも限界があります。allowlist は解決時点の IP で効くため、同じ CDN エッジに載る別ドメインは通りますし、DNS(udp 53)は無条件許可なので DNS トンネリングも防げません。位置づけは「悪意あるコードを確実に封じる壁」ではなく「事故とうっかり持ち出しを防ぐ層」です。なお公開後のセキュリティレビューを受けて、途中失敗時に全開放のまま止まらないようにする fail-closed 化と、任意ホストへの SSH(port 22)全許可の削除の2パッチを blog-examples の最終形に追加済みです。

## 第1部: firewall まわり(罠1〜4)

### 罠1: 公式スクリプトは現在、誰が使っても起動失敗する

公式の `init-firewall.sh` は allowlist のドメインを DNS 解決して ipset に登録しますが、リストにハードコードされた `statsig.anthropic.com` が現在 NXDOMAIN です(権威応答。複数リゾルバで確認)。スクリプトは1ドメインでも解決に失敗すると `exit 1` する作りなので、postStart が必ず失敗し、コンテナが使えません。

```
Resolving statsig.anthropic.com...
ERROR: Failed to resolve statsig.anthropic.com
postStartCommand from devcontainer.json failed with exit code 1.
```

対処は「解決できないドメインは警告してスキップ」です。失敗方向が「余計に塞ぐ」側(fail-closed)なので、安全性は落ちません。

```bash
if [ -z "$ips" ]; then
    echo "WARN: Failed to resolve $domain - skipping (stays blocked)"
    continue
fi
```

### 罠2: feature がパッチを上書きしてくる

上のパッチを Dockerfile の `COPY` でイメージに入れても動きません。あとの build stage で claude-code feature(v1.0.5)が自前の未パッチ版を同じパス `/usr/local/bin/init-firewall.sh` にインストールするからです。

```
Optional network firewall script installed at /usr/local/bin/init-firewall.sh
```

feature のオプションでこのインストールを無効化する手段はなく、layer の順序で COPY は必ず負けます。対処は postStart で毎回 cp し直すことです。

```json
"postStartCommand": "sudo cp .devcontainer/init-firewall.sh /usr/local/bin/init-firewall.sh && sudo /usr/local/bin/init-firewall.sh"
```

### 罠3: スクリプトは再実行すると自分に塞がれてハングする

allowlist を更新して起動中のコンテナで再実行すると、今度はハングします。初回実行で OUTPUT ポリシーが DROP になったまま、再実行時の序盤で GitHub の IP range を `curl` で取りに行くためです。ルールは flush 済み・ipset も破棄済み・でもポリシーは DROP、という状態で外に出られません。

flush 直後にポリシーを ACCEPT に戻す3行で再実行可能になります(最後に DROP を張り直すのは従来どおり)。

```bash
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
```

### 罠4: ipset の重複 add で即死する

ログイン用ドメイン(後述)を allowlist に足したところ、今度はここで死にました。

```
Adding 160.79.104.10 for claude.ai
ipset v7.22: Element cannot be added to the set: it's already added
```

`claude.ai` が `api.anthropic.com` と同じ IP に解決され、素の `ipset add` は重複をエラーにするため、`set -e` で即終了します。`ipset add -exist` で冪等にして解決です。

ついでに分かったこと: 公式スクリプトの allowlist には OAuth ログインに必要なドメイン(`claude.ai` / `claude.com` / `platform.claude.com`)が入っていません。公式の [network-config ドキュメント](https://code.claude.com/docs/en/network-config)には必要ドメインとして記載があるので、リファレンス実装側の欠落です。今回の環境では認証系が `api.anthropic.com` と同一 IP に載っていた偶然でログインが通っていましたが、経路が変われば黙って壊れるので、明示的に追加しておくべきです。

## 第2部: pnpm まわり(罠5〜7)

### 罠5: bind mount のままだと node_modules がホストを壊す

コンテナ内で `pnpm install` すると、bind mount されたワークスペースの `node_modules` に Linux 用バイナリ(esbuild や rolldown の platform package)が書き込まれ、ホスト macOS 側の環境が壊れます。逆も然り。`node_modules` だけ named volume を被せてコンテナ専用にするのが定石です。

```json
"mounts": [
  "source=myapp-node-modules,target=${containerWorkspaceFolder}/node_modules,type=volume"
]
```

### 罠6: pnpm の store がホストに漏れる。しかも設定では防げない

コンテナ内の pnpm がグローバル store をワークスペース直下の `.pnpm-store/` にフォールバックし、bind mount 経由でホストのリポジトリに数百MBの store が出現しました。

ここからが本当の罠です。`npm_config_store_dir` で store を volume 側に向けたところ、コンテンツ本体の store(v10)は指定どおり volume に入ったのに、新形式の index(`.pnpm-store/v11`、SQLite の index.db)だけがワークスペース直下に書かれ続けました。env を明示 override して `pnpm store path` を叩いても workspace パスを返すことを実測済みで、pnpm 10.25 ではこの経路に設定が効いていません。

設定で防げないものは構造で防ぎます。`.pnpm-store` のパス自体に named volume を被せて、何をどこに書こうとしてもホストに届かないようにしました。

```json
"source=myapp-pnpm-store,target=${containerWorkspaceFolder}/.pnpm-store,type=volume"
```

### 罠7: `pnpm@latest` がホストとメジャー違いを引いてくる

当初 postCreate で `corepack prepare pnpm@latest --activate` としていたら、ホストは pnpm 10.25、コンテナは 11.17 になりました。pnpm 11 は `package.json` の `pnpm.overrides` を本当に無視する(10.25 は警告付きで適用)ため、コンテナ側の install が bind mount 越しに `pnpm-lock.yaml` から overrides 由来のエントリを消し、ホストと食い違う lockfile ができ上がります。

対処は2段です。まず標準の `packageManager` フィールドをホスト・コンテナ共通の唯一の情報源にする。

```json
{ "packageManager": "pnpm@10.25.0" }
```

さらに postCreate の自動 install を `--frozen-lockfile` にして、コンテナ作成が lockfile を書き換える経路自体を塞ぎます。`CI=true` を付けているのは、volume に残った古い `node_modules` を pnpm が作り直す際の確認プロンプトが非 TTY で `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` になるのを避けるためです。

```json
"postCreateCommand": "sudo chown node:node node_modules .pnpm-store && sudo chown -R node:node /home/node/.claude && sudo corepack enable && CI=true pnpm install --frozen-lockfile"
```

## 第3部: 権限(罠8)

### 罠8: `~/.claude` volume が root 所有 → エラーは「OAuth error: Invalid code」

ログイン状態をコンテナ再作成後も保持するため、公式ドキュメントどおり `~/.claude` を named volume にしました。ところが `/login` が何度やっても失敗します。

```
OAuth error: Invalid code. Please make sure the full code was copied
```

コードのコピーミスを疑うメッセージですが、真犯人は別でした。同じ画面に出ていたこちらです。

```
Command failed: EACCES: permission denied, mkdir '/home/node/.claude/session-env'
```

named volume は初回 root 所有で作られるため、`node` ユーザーの Claude Code がログイン状態を書き込めず、それが「Invalid code」として報告されていました。firewall が認証をブロックしている説も疑いましたが、コンテナ内から認証ドメインへの疎通を実測して無罪を確認。`chown` 一発で解決し、以後は再作成してもログイン不要です(postCreate に組み込み済み。罠7のコード参照)。

エラーメッセージが原因と別の場所を指してくるのが、この罠の悪質なところです。dev container で「Invalid code」を見たら、まず `~/.claude` の書き込み権限を疑ってください。

## 犯人の内訳

8つを整理すると、責任の所在は3つに分かれます。

- **主犯: 公式リファレンス実装の風化**(罠1・2・4、ログインドメイン欠落、罠8のドキュメント不備)。「公式の見本」の顔をしていますが、DNS が消えたドメインを握ったまま誰が使っても起動失敗する状態が放置されており、ドキュメントとの食い違いもあります
- **従犯: pnpm 10→11 の過渡期**(罠5は一般論として、罠6・7)。特に store index が設定を無視するのは設定で防ぎようがなく、volume で蓋をする以外にありませんでした
- **無罪: devcontainer 仕様と CLI**。variable 展開・named volume・lifecycle・`--remove-existing-container`、すべて仕様どおり動きました。Claude Code 本体もほぼ無罪で、有罪なのは EACCES を「Invalid code」と報告するエラーメッセージだけです

## まとめ

「よく使われている公式サンプル」は誰かが先に踏んでいますが、「めったに使われない公式サンプル」は自分が最初の踏み手になります。今回はまさにそれで、8つ全部に再現手順と原因が付いたので、パッチ済みの最終形として固められました。

構成一式(devcontainer.json / Dockerfile / パッチ済み init-firewall.sh)は [blog-examples](https://github.com/mohhh-ok/blog-examples/tree/main/2026/08-08-claude-code-devcontainer) にあります。`myapp` を自分のプロジェクト名に置換すれば、pnpm プロジェクトならそのまま使えるはずです。feature や上流スクリプトの更新で状況は変わり得るので、その点はご留意ください。
