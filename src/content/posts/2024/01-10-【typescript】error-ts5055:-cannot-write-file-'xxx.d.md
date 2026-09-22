---
title: "【TypeScript】error TS5055: Cannot write file 'xxx.d.ts' because it would overwrite input file."
pubDate: 2024-01-10
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## tscコマンドのエラー

tscコマンドでいつも通りTypeScriptからJavaScriptに変換しようとしたのですが、エラーで止まりました。

```
error TS5055: Cannot write file 'xxx.d.ts' because it would overwrite input file.
```

これは今までも何度か出たエラーで、大体はtsconfigを以下のようにすると直ります。

```json
{
    "compilerOptions": {
        ...
        "rootDir": "./src",
        "outDir": "./dist",
        ...
    },
    "include": [
        "src"
    ],
    "exclude": [
        "dist",
    ],
}
```

ところが今回、なぜかこれで直らなかったためChatGPTに聞きました。しかし解決せず。

## distファイルをimportしていた。

今回の原因は、distファイルをインポートしていたことが原因でした。具体的には、同じプロジェクトにあるsrcファイルから、distファイルを参照していました。

```typescript
import {xx} from "@yyy/dist/zzz"
```

もちろん他プロジェクトからの参照なら問題ないのですが、おそらく同じプロジェクトで参照していたことで、tsc変換時に不都合があったようです。これを以下のようにすることで解決しました。

```typescript
import {xx} from "../zzz"
```

## 小話

最近一日の終わりにちょっとだけお酒を飲み始めました。ポテチと一緒に飲む酎ハイ、たまらんです。
