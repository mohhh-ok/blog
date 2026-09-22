---
title: "【GAS】doPostで受け取れる最大文字数を調べてみた"
pubDate: 2024-06-18
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GASのdoPost

GASではウェブアプリ化してデータを受け取り、色々と処理できる様になる機能があります。ところが画像を受け取ることができない様で、画像を受け取るにはBase64エンコードしないといけない様です。しかしそうするとデータ量が膨大になりますので、はたしてどこまでできるのかを知るべく検証しました。

## 検証コード

以下のコードを用いました。

GAS

```
function doPost(e) {
  addLog(JSON.stringify({
    length: e.postData.length,
  }))
}

function addLog(str) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ログ');
  sheet.appendRow([str]);
}
```

送信側

```
const url = ''; // デプロイしたURL
const length = 0; // 検証サイズ

fetch(url, {
  method: 'post',
  mode: 'no-cors',
  body: 'a'.repeat(length),
});
```

## 結果

1000\*1000\*10までは送信できることが確認できました。1000\*1000\*100だと413エラーでした。

このことから、10M文字数までは送信できる様です。Base64エンコードすると133%になるそうですので、画像だと7.5MBほどでしょうか。思ったより少ないですね。

## 余談

最近は暑いので、ペットボトルは質より量です。コーヒーも、なるべく大きいのを買ってます。
