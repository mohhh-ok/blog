---
title: "【MCP】APIトークンを安全にKeychain保管する【Claude Code】"
pubDate: 2026-05-13
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## MCPサーバーのトークン

MCPサーバーはテキストファイルに平文でパスワードを保存するものがあります。たとえばChatworkの場合、以下のようになっています。

https://github.com/chatwork/chatwork-mcp-server

```json
{
  "mcpServers": {
    "chatwork": {
      "command": "npx",
      "args": ["@chatwork/mcp-server"],
      "env": {
        "CHATWORK_API_TOKEN": "YOUR_CHATWORK_API_TOKEN"
      }
    }
  }
}
```

Slack、GitHub、Notionなども同じ手法だそうです（AI談）

これはさすがに厳しいと思い、対策をしてみます。

## macOS Keychainで対策する

### 1. トークンをKeychainに保存

トークンをmacOS Keychainに保存します。

```sh
security add-generic-password -a "$USER" -s chatwork-api-token -w 'YOUR_TOKEN'
```

`-a` はアカウント名、`-s` はサービス名（あとで取り出すときのキー）、`-w` がパスワード（トークン本体）です。

重複登録をしようとすると、already existsで弾かれます。その場合は別のサービス名を使用してください。

確認してみます。

```sh
security find-generic-password -a "$USER" -s chatwork-api-token -w
```

成功すれば、無事に先ほど入れたトークンが出力されます。

### 2. Claude Codeに追加する

以下のコマンドで追加します。

```sh
claude mcp add chatwork \
  --scope user \
  -- sh -c 'CHATWORK_API_TOKEN=$(/usr/bin/security find-generic-password -a "$USER" -s chatwork-api-token -w) exec npx -y @chatwork/mcp-server'
```

実行後、`~/.claude/settings.json`をで追加されていることが確認できます。


## 試してみる

以下のようなプロンプトで試すことができます。

```
Chatworkで自分の情報を取得して
```

取得できればOKです。
