---
title: "【GAS】文字列にBOMを追加する【AI泣かせ】"
pubDate: 2025-01-15
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## BOM

BOMは、Excel対応で必要になります。一方でBOMがあるとエラーになる環境もあるようで、この辺りMicrosoftにはどうにかして欲しいものです。

## GASでのバイト周り

GASでは、バイト操作が独特です。atobやbtoaが使えない、エンコーダーが使えない、といった制約の代わりにUtilitiesクラスが提供されています。

ただ情報があまりに少なくて苦労します。AIもなかなか正解を出せません。

## GASで文字列にBOMを追加する

最終的に、以下で実現できました。

```javascript
const BOM = [239, 187, 191];
const dataBytes = Utilities.newBlob(data).getBytes();
const finalBytes = [...BOM, ...dataBytes];
const base64 = Utilities.base64Encode(finalBytes);
```

かなり苦労したのですが、最終的にこれだけ。。。？これは、なかなかのやるせなさを感じますね。ちーん、ぽくぽくぽく。
