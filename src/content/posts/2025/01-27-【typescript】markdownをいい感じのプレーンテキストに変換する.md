---
title: "【TypeScript】Markdownをいい感じのプレーンテキストに変換する"
pubDate: 2025-01-27
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Markdown

Markdownは、エンジニアが涎を垂らしながら使うフォーマットです。仕様があるため、HTMLなどにコンバート可能です。

## いい感じにプレーンテキストに変換する

Markdownのままでも読めるのですが、どうせならもっと見やすいプレーンテキストにできないかと思い、やってみました。

markedライブラリを使います。

```
npm i marked
```

準備として、テキスト長を計測する関数を作ります。日本語は２としてカウントします。

```typescript
function calculateTextWidth(text: string) {
  let width = 0;

  // 各文字をループして幅を加算
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);

    // 日本語（漢字、ひらがな、カタカナ）は幅2
    if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(char)) {
      width += 2;
    } else {
      width += 1;
    }
  }

  return width;
}
```

rendererを作ります。

```typescript
import { RendererObject } from 'marked';

const renderer: RendererObject = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const margin = 1;
    const marginSpace = ' '.repeat(margin);

    if (depth == 1) {
      const marker = '='.repeat(calculateTextWidth(text) + margin * 2);
      return `${marker}\n${marginSpace}${text}\n${marker}\n\n`;
    } else {
      const marker = '='.repeat(depth - 1);
      return `${marker} ${text} ${marker}\n\n`;
    }
  },
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `${text.trim()}\n\n`;
  },
  list({ items }) {
    const text = items.map((item) => `* ${item.text}`).join('\n');
    return `${text.trim()}\n\n`;
  },
};
```

簡単に、heading, paragraph, listに対応させました。

実行します。

```typescript
import marked from 'marked';

function renderMd(markdown: string) {
  marked.use({ renderer });
  const text = marked.parse(markdown);
  console.log(text);
}

const markdownText = `
  # タイトルtitle

  本文1

  ## タイトル2

  本文2

  ### タイトル3

  本文3

  - 箇条書き1
  - 箇条書き2
  `;

renderMd(markdownText);
```

以下の結果になりました。

```
===============
 タイトルtitle
===============

本文1

= タイトル2 =

本文2

== タイトル3 ==

本文3

* 箇条書き1
* 箇条書き2


```
