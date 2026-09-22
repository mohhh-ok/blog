---
title: "【React】useState使用時に画面が一瞬消える問題"
pubDate: 2023-10-27
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

今回は、useStateで値を更新した時に、なぜか画面がチラつく現象が起きましたので、その解決方法を共有させていただきます。

## ちらつくコード

以下のコードで、画面がちらついてしまいます。

```typescript
"use client"

import { useState } from "react";

export default async function Test() {
    const [test, setTest] = useState<string>('test');


    const handleChange = (e: any) => {
        setTest(e.target.value)
    }

    return (<>
        <div>
            <input type="text" value={test} onChange={handleChange} />
        </div>
    </>);
}
```

## 解決方法

非同期にしていたことが問題でした。サーバーだと非同期にしないといけないので、その辺りで混在してしまったものと思われます。ですので、上記からasyncを外せば、正常に動作するようになります。

layoutの問題なのか、muiにバグがあるのか、middlewareかなどなど問題の切り分けに苦労しました。特にlayoutを入れ子にしているので、きっとどこかのlayoutで問題があるに違いない。テーマプロバイダーか？バックエンドとの通信か？などなど。まさかこんな単純な話だったとは。なかなか気づかないものですね。

ではでは。
