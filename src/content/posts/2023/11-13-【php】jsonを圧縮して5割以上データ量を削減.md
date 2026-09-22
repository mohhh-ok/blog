---
title: "【PHP】JSONを圧縮して5割以上データ量を削減"
pubDate: 2023-11-13
categories: ["PHP"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

PHPからJavaScriptにデータを渡す時にJSONを使用することがほとんどかと思いますが、今回は圧縮してデータを渡すお話です。

## JSONデータを圧縮して渡す

JSONで渡す際は、以下のように行います。

```php
$json = json_encode($data);
$json = gzcompress($json);
$json = base64_encode($json);

echo "<input type='hidden' class='xxx' value='$json' />";
```

## JavaScriptで圧縮データを受け取る

受け取る側は以下のような具合です。es module形式です。

```javascript
import pako from 'https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm'


const encodedData = document.querySelector('.xxx').value;

// Base64デコード
const binaryString = atob(encodedData);

// バイナリ文字列からUint8Arrayを作成
const charList = binaryString.split('').map(c => c.charCodeAt(0));
const uintArray = new Uint8Array(charList);

// gzip圧縮を解除（pakoライブラリを使用）
const decompressed = pako.inflate(uintArray, { to: 'string' });
```

## 結果

データによりますが、私の扱っていたデータでは以下のようになりました。

```
compressed bytes: 267377 -> 12808
compressed bytes: 87199 -> 49464
compressed bytes: 83782 -> 33784
compressed bytes: 89291 -> 37632
compressed bytes: 69597 -> 25804
compressed bytes: 74065 -> 27968
compressed bytes: 34475 -> 9792
```

せっかく圧縮しても、Base64エンコードしてしまったら結果大して変わらないかと思っていましたが、おおむね５割以上削減できています。こんなに効果があるのなら、もっと早くやっておけば良かったと思っている今この頃です。
