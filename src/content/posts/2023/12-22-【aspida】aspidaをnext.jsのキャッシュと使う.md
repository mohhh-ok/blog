---
title: "【aspida】aspidaをNext.jsのキャッシュと使う"
pubDate: 2023-12-22
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Next.jsのキャッシュ

Next.jsでは、デフォルトでキャッシュ機能があります。

https://nextjs.org/docs/app/api-reference/functions/fetch

JavaScriptにはfetch関数がありますが、通常はクライアントキャッシュです。ですがNext.jsはこのfetch関数を独自拡張して、サーバーキャッシュが使えるようになっています。

## aspidaでNext.jsのキャッシュを使う

aspidaはaxiosとfetchのどちらでも初期化できます。Next.jsのキャッシュを使いたいため、fetchで以下のように初期化します。

```typescript
import fetchClient from "@aspida/fetch"
import api from "../api-generated/$api"

export const apiCacheClient = api(fetchClient(
    fetch,
    {
        cache: 'force-cache',
        next: {
            revalidate: 10, // 10秒間キャッシュ
        }
        ...
    } as any
));
```

これで、aspidaを普通に使うだけでキャッシュが効くようになります。

## 小話

最近は、中村屋のレトルトカレーにハマってます。少々お高いですが、旨いです。
