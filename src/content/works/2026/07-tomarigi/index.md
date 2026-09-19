---
title: "Tomarigi (止まり木)"
personal: true
startDate: 2026-07
endDate: 2026-08
techs: ["WXT", "React", "TypeScript", "IndexedDB", "Web Audio", "Document Picture-in-Picture", "File System Access API"]
summary: AI エージェントのセッションを見守る Chrome 拡張。止まり木にとまる鳥たちが、各セッションの状態を仕草で示す。
heroImage: ./hero.webp
---

Chrome Web Store: <https://chromewebstore.google.com/detail/tomarigi/jgkjejameolpmmnohlgahonfejfefjgp>

紹介ページ: <https://moh-tech.net/tomarigi/>

## 概要

Claude Code などの AI エージェントを走らせながら別の窓で作業していると、いま何をしているのか分からなくなる。止まり木の鳥たちがセッションごとの状態(作業中 / 許可待ち / 立ち往生 / 完了 / うたた寝)を仕草で表現し、ちらっと視線を送るだけで様子が分かるようにする Chrome 拡張。

Document Picture-in-Picture の小窓に切り替えれば、ターミナルの上に常時最前面で置ける。

## 設計上のポイント

- **サーバー・ネイティブ常駐なし**。File System Access API で `~/.claude/projects` などのフォルダを直接読み、ブラウザ内で完結する。複数フォルダを登録して並行監視できる
- **manifest 権限ゼロ**。API キーも不要で、状態判定はローカルヒューリスティックのみ
- 状態遷移は Web Audio の合成音で通知(音源ファイルなし・ミュート可)
- サブエージェントは親セッションの下に「ひな」として表示
- データソースはアダプタ化し、将来 Claude Code 以外のエージェントにも広げられる形にした

## 国際化

43 ロケール対応。`scripts/locales/*.mjs` に機能グループ単位で分割し、1キーごとに 43 ロケール分を inline で持つ形にしている。`gen:locales` で `public/_locales/` を再生成、`verify:locales` で全キー完全一致を強制。
