---
title: "【Quill】&lt;p>&lt;br>&lt;/p>を抑制する"
pubDate: 2024-06-13
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Quill

QuillはNodeで使用できるWSYSIGエディタです。

https://quilljs.com

## 問題

編集時に返ってくるHTMLに、なぜか不要な<p><br></p>が入ってきます。エディタで編集した以上の数が入ってきます。そのためHTMLをサーバーに保存した後、再度表示すると、余計な<p><br></p>のために空行が増えているという現象が起きていました。

## 解決

以下の様にすることで、余分な<p><br></p>が入らない様になりました。

```
import ReactQuill from 'react-quill';

<ReactQuill
  modules={{
    clipboard: {
      matchVisual: false
    }
  }}
  ... // 他のプロパティ
/>
```

## 余談

朝コンビニから帰ってくると、家の前に猫がいました。私が見ても逃げ出さず、憎たらしい目でこちらを見てました。猫を飼う気はないんですよねー。うーむ。
