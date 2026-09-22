---
title: "【GAS】バンドルしたdayjsは、タイムゾーンを解釈する"
pubDate: 2025-01-30
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GASコードをバンドル

GASコードをバンドルすることで、dayjsなどのエコシステムを使うことができるようになります。esbuildでバンドルするライブラリを、以下で公開しています。

[https://www.npmjs.com/package/gasup](https://www.npmjs.com/package/gasup)

## dayjs

dayjsは、日付を簡単に扱えるライブラリです。JavaScriptのDateはお粗末なので、必須です。これをバンドルした場合、タイムゾーンはどうなるか実験しました。

```
console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
```

## 結果

デフォルトでは日本時刻ではありませんでした。その後appsscript.jsonにてtimezoneをAsia/Tokyoにすると、ちゃんと日本時刻が表示されました。

new Dateの結果がappsscript.jsonのタイムゾーンに従っていることが理由のようです。これで、dayjsを気兼ねなくGASで使えそうです。
