---
title: "【JavaScript】package公開時に、.gitignoreを含める"
pubDate: 2025-01-15
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

今回、以下のpackage作成時に、.gitignoreが含まれない問題がありました。

[https://www.npmjs.com/package/@masa-dev/create-gas-app](https://www.npmjs.com/package/@masa-dev/create-gas-app)

これを解決したお話です。

## package

package公開時には、.gitignoreが含まれません。assetsに.gitignoreを含めています。

```json
package.json

{
  "files": [
    "dist",
    "assets"
  ],
}
```

以下のようにすることで、.gitignoreも含むようになります。

```json
package.json

{
  "files": [
    "dist",
    "assets",
    "assets/**/.gitignore"
  ],
}
```
