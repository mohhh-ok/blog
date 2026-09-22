---
title: "【Flutter】SingleChildScrollViewで常にスクロールバーを表示する【2025年版】"
pubDate: 2025-01-21
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## SingleChildScrollView

Flutterは、スクロールバーにも常に気を使わないといけません。スクロール可能にするためには、ウィジェットをSingleChildScrollViewで囲む必要があります。

## 常にスクロールバーを表示

以下のように、Scrollbarで囲み、thumbVisibilityを指定します

```dart
Scrollbar(
  thumbVisibility: true,
  child: SingleChildScrollView(
    child: XXX,
)),
```

なお2025年1月21日現在、isAlwaysShownは廃止されています。
