---
title: "【Zed】dprintフォーマッタを導入してみる"
pubDate: 2025-10-19
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Zedのフォーマッタ

Zedのフォーマッタは、デフォルトではPrettierのような挙動をします。Prettier撲滅委員の私としては見過ごせません。さっそくdprintを導入することにしました。

## 拡張機能

Zedの拡張機能としてdprintはありました。早速インストールしたのですが動きません。それまでに色々といじっていたのが原因かもしれませんが、そもそもプラグインのバージョンが0.0.1となんとも心許ないため、下記のようにしました。

## とりあえずプロジェクトに入れてみる

以下のようにして入れました。TypeScriptのプロジェクトです。

```bash
pnpm i -D dprint
pnpm dprint config init
pnpm dprint config add typescript
pnpm dprint config add json
pnpm dprint config add markdown
pnpm dprint config add dockerfile
```

zedの設定ファイルをいじります。

./.zed/settings.json

```json
{
  "format_on_save":"on",
  "formatter":{
    "external":{
      "command":"./node_modules/.bin/dprint",
      "arguments":["fmt","--stdin","{buffer_path}"
    ]}
  }
}
```

これでひとまず入れることができました。プロジェクトに入れたため、他のメンバーにも強制できます。開始メンバーの特権ですはい。
