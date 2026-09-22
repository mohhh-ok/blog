---
title: "【macOS】ターミナル配下の外付けボリュームが突然 Operation not permitted になる【Tahoe】"
pubDate: 2026-09-09
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

macOS 26.5.2 (25F84) で、ターミナル（Ghostty 1.3.1）から外付けボリュームを触ると全部 `Operation not permitted` になる状態に 2 回入りました。1 回目は約 25 時間続きました。設定の許可は生きたままです。

原因は特定できていませんが、直し方は 3 通り確認できていて、どれも再起動が要りません。症状と直し方を先に書きます。

## 症状

ターミナル配下のプロセス全部で、外付けボリュームの一覧と読み書きができなくなります。zsh、`ls`、`mkdir`、`touch`、そこから起動した CLI（AI コーディングエージェント、コンテナ管理ツール、パッケージマネージャ）まで全部です。

- `ls /Volumes/EXTERNAL` が `Operation not permitted`
- `mount` にはマウント済みで出る
- `stat` は通る（メタデータは読める）
- Claude Code の Bash に入っている sandbox を外しても同じ

同時に、システム設定 > プライバシーとセキュリティ > フルディスクアクセスに、ターミナルアプリがトグル OFF の状態で自動的に載ります。ダイアログは出ません。さらに「ファイルとフォルダ」でそのアプリを開くと、フォルダ別のトグル（ダウンロード、リムーバブルボリュームなど）が消えて、「フルディスクアクセス」の 1 行だけになります。

![システム設定のプライバシーとセキュリティ「ファイルとフォルダ」で Ghostty.app を開いたところ。フォルダ別のトグルが並ばず、「フルディスクアクセス」の 1 行だけが表示されている](./09-09-macos26-files-folders-ghostty-fda.webp)

macOS は、同じターミナルから起動した子プロセスをまとめてターミナルアプリの許可で判定します（責任プロセス）。だから `ls` の拒否がターミナルアプリの許可に紐づいて出ます。

本件かどうかはログ 2 本で判定できます。

```
ls /Volumes/EXTERNAL            # Operation not permitted
mount | grep EXTERNAL           # 載っている

/usr/bin/log show --last 10m --style compact \
  --predicate 'eventMessage CONTAINS "System Policy:" AND eventMessage CONTAINS "/Volumes/EXTERNAL"'

/usr/bin/log show --last 10m --info --style compact \
  --predicate 'subsystem == "com.apple.TCC" AND eventMessage CONTAINS "RemovableVolumes" AND eventMessage CONTAINS "Handling access request"'
```

前者に `System Policy: ls(12345) deny(1) file-read-data /Volumes/EXTERNAL` の形の行が並び、後者が `Allowed (User Consent)` なら本件です。許可の記録は Allowed のまま、実施側のカーネルが deny を返し続けている、という食い違いになっています。1 回目は 25 時間で deny が 18,070 行出ていました。拒否している間、多くのアクセスは tccd への問い合わせすら発生しません。カーネル側で判定が完結しています。

`log` は zsh の組み込みと衝突するので、`/usr/bin/log` で呼びます。

## 直し方

そのターミナルアプリのフルディスクアクセスの記録をリセットします。sudo は要りません。

```
tccutil reset SystemPolicyAllFiles com.mitchellh.ghostty
```

`com.mitchellh.ghostty` は Ghostty の bundle id なので、他のターミナルを使っているなら置き換えてください。bundle id は `osascript -e 'id of app "iTerm"'` のようにアプリ名から引けます。

同じことは設定画面からもできます。フルディスクアクセスの一覧で、勝手に載ったターミナルアプリの行を「−」で削除します。手元では削除の 4 秒後に読み書きが戻りました。tccd のログには `TCCAccessResetInternal` と `TCCDEvent: type=Delete, service=kTCCServiceSystemPolicyAllFiles` が出ます。`tccutil` の 1 行でも同じイベントが出ることを確認しています。

3 通り目は偶然で、別のアプリ宛ての「リムーバブルボリュームへのアクセス」ダイアログを許可したら 3 秒後に戻りました。TCC への書き込みで古い判定が捨てられる機構がある、という傍証だと推定しています。

Ghostty の discussion では、ターミナルアプリを Cmd+Q して起動し直すのも有効だと報告されています。

## 仕様との乖離

[Apple Platform Security ガイドの「Controlling app access to files」](https://support.apple.com/guide/security/controlling-app-access-to-files-secddd1d86a6/web)は、"Full internal storage access"（フルディスクアクセス）と "Files and folders"（デスクトップ、書類、ダウンロード、ネットワークボリューム、リムーバブルボリュームを含む）を別々の項目として書いています。片方がもう片方を含むとか、優先順位があるといった記述はありません。サポート記事の [Control access to files and folders on Mac](https://support.apple.com/guide/mac-help/mchld5a35146/mac) と [Full Disk Access](https://support.apple.com/en-us/guide/mac-help/mchl211c911f/mac) も、互いに言及していません。

観測はこれと 2 か所ずれています。

1 つ目は、フルディスクアクセスの一覧に載っただけ（トグルは OFF）で、設定 UI からフォルダ別の許可が見えなくなることです。上のスクリーンショットがその状態です。許可自体は残っていて、tccd のログでも `kTCCServiceSystemPolicyRemovableVolumes` の判定は Allowed のままでした。

2 つ目は、設定 UI でもログでも許可されているのに、カーネルが拒否し続けることです。

## 分かっていないこと

引き金は確定していません。手元で観測できたのは次の 2 件です。

- 1 回目は、`find / -maxdepth 6` が外付け上の `.Spotlight-V100` などを読んで拒否された 21 ms 後から、同じボリュームの通常のパスも拒否に変わった
- 2 回目は、ターミナル配下のプロセスが `~/Documents`（過去にダイアログで拒否したフォルダ）で拒否された 24 秒後に始まった

一覧への自動登録が起きるのは、フルディスクアクセスでしか読めない場所へアクセスした瞬間です。外付け上の `.Spotlight-V100` `.Trashes` `.DocumentRevisions-V100` `.TemporaryItems` や、`~/Library/Application Support/com.apple.TCC/TCC.db` がそれに当たります。tccd のログには `Service kTCCServiceSystemPolicyAllFiles does not allow prompting; recording denied.` が出ます。

ただし、同じ形の拒否（TCC.db の読み取り失敗）が起きても壊れなかった例が 1 件あるので、これだけが条件ではありません。2 回とも、拒否が始まる前にメモリ圧迫（memorystatus による kill）はありませんでした。Ghostty の discussion はメモリ圧迫を引き金と推定していますが、手元の 2 回はそれと一致しません。

Apple がこの挙動を認めた記録も見つけられていません。

## 既存の報告

| 出典 | 内容 |
|---|---|
| [Eclectic Light Company 2026-04-15](https://eclecticlight.co/2026/04/15/privacy-which-folders-are-protected-in-tahoe/) | テストアプリが個別の Files & Folders ではなくフルディスクアクセス一覧に自動追加された。FDA は付与されておらず、一覧から削除すると個別の Files & Folders が表示された |
| [Eclectic Light Company 2026-04-08](https://eclecticlight.co/2026/04/08/privacy-files-folders-or-full-disk-access/) | FDA が無い場合に Files & Folders の個別設定が適用される、という実地検証 |
| [MacPowerUsers Talk 2026-03-30](https://talk.macpowerusers.com/t/my-full-disc-access-files-folders-settings-views-seem-to-contradict-each-other-re-fda-privileges-macos-26/44841) | Files & Folders でフルディスクアクセスがグレー表示になる。UI が悪い |
| [Lapcat Software 2026-07](https://lapcatsoftware.com/articles/2026/7/12.html) | FDA が OFF の Terminal / Xcode が、Files & Folders 側では FDA ありと表示される |
| [ghostty-org/ghostty discussion #12947](https://github.com/ghostty-org/ghostty/discussions/12947) | kernel Sandbox の System Policy deny であって TCC の deny ではない。TCC.db は authValue=2（許可）のまま。外付け APFS 4 台が同時に Ghostty 配下だけで読み書き不能 |
| [anthropics/claude-code issue #58952](https://github.com/anthropics/claude-code/issues/58952) | Tahoe 26.x でターミナルのプロセスツリーが `~/Documents` で EPERM |

上の 4 件は設定 UI の表示の話、下の 2 件がアクセスできなくなる話です。

## まとめ

ターミナル配下だけ外付けが `Operation not permitted` になったら、`tccutil reset SystemPolicyAllFiles <bundle id>` を 1 回叩けば戻ります。設定画面のフルディスクアクセス一覧からその行を削除しても同じです。再起動もログアウトも要りません。

引き金がまだ分からないので、また同じ状態に入ったら同じ手順で戻すことになります。似た症状に遭遇したら、まず上のログ 2 本で本件かどうかを確かめるのがよいと思います。
