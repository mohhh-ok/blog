---
title: "【JavaScript】Playwrightのevaluateはクロージャ諸々使えない"
pubDate: 2024-12-16
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Playwright

PlaywrightはChromiumを使えるJavaScriptライブラリです。

## evaluate

ブラウザ内でJavaScriptを実行する場合に、evaluateを使用します。

```javascript
const href = await page.evaluate(() => document.location.href);
```

公式サイトによれば、asyncも使えるようです。

```javascript
const status = await page.evaluate(async () => {
  const response = await fetch(location.href);
  return response.status;
});
```

中でconsole.logを使っても、外には反映されません。

```javascript
const href = await page.evaluate(() => console.log('abc'));
```

また、クロージャは動きません。悲しい。

```javascript
const data = 'some data';
const result = await page.evaluate(() => {
  // WRONG: there is no "data" in the web page.
  window.myApp.use(data);
});
```

データを中に渡すには、以下のようにします。

```javascript
const data = 'some data';
// Pass |data| as a parameter.
const result = await page.evaluate(data => {
  window.myApp.use(data);
}, data);
```

外に色々なデータを出したいときは、構造体を使うとよさそうです。

```javascript
const result = await page.evaluate(() => {
  return {
    data: 'aaa',
    logs: ['log1', 'log2'],
  }
});
```
