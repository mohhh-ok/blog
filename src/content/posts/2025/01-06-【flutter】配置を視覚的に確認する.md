---
title: "【Flutter】配置を視覚的に確認する"
pubDate: 2025-01-06
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 配置

HTMLだと、要素の配置はborderなどで視覚的に判断できますが、Flutterだと手軽に行えません。しかし今回ご紹介する方法で、簡単に確認することができます。

## debugPaintSizeEnabledを用いる

以下のようにして、簡単に配置を確認できます。

```dart
import 'package:flutter/rendering.dart';

void main() {
  debugPaintSizeEnabled = true;
  ...
}
```

このdebugPaintSizeEnabledはグローバルなため、どこでも設定できます。ちょっと見たくなった時に、ささっとtrueにすれば、簡単に配置を確認できます。便利ですね。
