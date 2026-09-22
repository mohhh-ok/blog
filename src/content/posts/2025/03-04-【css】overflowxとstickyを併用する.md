---
title: "【CSS】overflowXとstickyを併用する"
pubDate: 2025-03-04
categories: ["HTML"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Stickyの挙動

Stickyは一番近いScroll Containerを基準にして機能します。通常はViewportがそれにあたります。しかし親のどこかでoverflowを指定すると、ViewPortではなくその親を基準にするようになってしまい、思うようにStickyが効かなくなります。

## overflowXと併用する

そのような中、overflowをどうしても使いたい時もあります。しかし上述の通り、親でoverflowを指定すると、Stickyは効かなくなります。

```html
<!-- overflow-x:auto 横スクロール可能にする -->
<div style="overflow-x:auto">
  <!-- position:sticky;top:0; Stickyな要素。効かない -->
  <div style="position:sticky;top:0;">Sticky</div>
  <!-- 内容 -->
  <div>
    <script>
      // 適当に文字列生成
      for(let i=0;i<100;i++){
        for(let j=0;j<500;j++){
          document.write('a');
        }
        document.write('<br/>');
      }
    </script>
  </div>
</div>
```

以下のようにheightを指定すると、overflowX: autoを使用してもstickyが動作します。

```html
<!-- overflow-x:auto 横スクロール可能にする -->
<div style="overflow-x:auto;height:100vh;">
  <!-- position:sticky;top:0; Stickyな要素-->
  <div style="position:sticky;top:0;">Sticky</div>
  <!-- 内容 -->
  <div>
    <script>
      // 適当に文字列生成
      for(let i=0;i<100;i++){
        for(let j=0;j<500;j++){
          document.write('a');
        }
        document.write('<br/>');
      }
    </script>
  </div>
</div>
```

position:relativeのように、基準点を指定できるようになるといいんですけどね。ひとまず、これで解決です。
