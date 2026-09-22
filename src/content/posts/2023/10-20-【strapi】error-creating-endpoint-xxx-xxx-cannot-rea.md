---
title: "【Strapi】Error creating endpoint xxx xxx Cannot read properties of undefined (reading xxx)"
pubDate: 2023-10-20
categories: ["Node.js"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

今回、表題のようなエラーが出まして、さっぱり分からずエラー内容で検索してみたら、ぴったりな記事を見つけました。

https://forum.strapi.io/t/error-when-trying-to-create-a-simple-custom-route-error-creating-endpoint-get-route-cannot-read-property-controller-function-of-undefined/14413

通常、以下のような構成になります。

```
custom-xxx
 ┗ controllers
    ┗ custom-xxx.ts
 ┗ documentation
    ┗ 1.0.0
       ┗ custom-xxx.json
 ┗ routes
    ┗ custom-xxx.ts
 ┗ services
    ┗ custom-xxx.ts
```

結論としましては、カスタムAPIのファイル名に、大文字やアンダーバーを使ってはいけないとのことです。キャメルケースもスネークケースもダメで、ケバブケースでやれとのことですね。いやいや、誰が気づくねんこんな仕様。リンク先で教えてくださっている方は、すごい。

ではでは。
