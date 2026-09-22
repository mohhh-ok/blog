---
title: "【CSS】stickyを要素に追従させる"
pubDate: "2025-11-12"
categories: ["HTML"]
---


こんにちは、フリーランスエンジニアのmohです。

## sticky

stickyはスクロールに追従させるときに使用します。「粘着」の意味のあるstickyですね。

## 要素に追従させる

任意の要素に追従する形です。ページ全体ではなく、途中からStickyするようにします。

<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="ByKNPyQ" data-pen-title="Untitled" data-user="MasaakiOta928" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/MasaakiOta928/pen/ByKNPyQ">
  Untitled</a> by moh (<a href="https://codepen.io/MasaakiOta928">@MasaakiOta928</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

### 必要項目

指定要素に追従させるには下記を指定します。

- parentのdisplay: flex
- position: sticky
- top などの位置情報
- align-self: flex-start

特にalign-selfを忘れてしまうことに注意です。align-selfがないと要素が広がってしまい、stickyがうまくいきません。

```css
.container {
  display: flex;
}
.content {
  background: #cdf;
}
.sticky {
  position: sticky;
  top: 0;
  align-self: flex-start;
  background: #fdc;
}
```

<br/>
