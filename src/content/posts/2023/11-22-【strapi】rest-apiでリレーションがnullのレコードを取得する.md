---
title: "【Strapi】REST APIでリレーションがnullのレコードを取得する"
pubDate: 2023-11-22
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## リレーションがnullのレコードをとる

さっそくですが、リレーションがnullのレコードを取るには、以下のようにします。

```
/api/xxx?filters[yyy][id][$null]=true
```

\[id\]がミソですね。これがないと、$nullを入れても正常に機能しません。
