---
title: "【Tauri】ファイルパーミッションが取れない問題"
pubDate: 2025-06-09
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Tauriでファイルパーミッションが取れない

今回、下記のような状況でした。

```
// app/src-tauri/capabilities/default.json

{
  "permissions": [
    ...
    "fs:allow-read-dir",
    "fs:allow-read-file"
  ]
}
```

フロントでのファイル選択ダイアログを経由すると大丈夫なのですが、そうじゃない場合にパーミッションが取れません。具体的には、アプリ起動時などですね。これは困りました。

## 詳細に設定すると取れる

下記のように、詳細を設定すると取れるようになりました。

```
// app/src-tauri/capabilities/default.json

{
  "permissions": [
    {
      "identifier": "fs:allow-read-dir",
      "allow": [
        {
          "path": "**"
        }
      ]
    },
    {
      "identifier": "fs:allow-read-file",
      "allow": [
        {
          "path": "**"
        }
      ]
    }
  ]
}
```

何か腑に落ちませんが、ひとまず動いたので安心です。
