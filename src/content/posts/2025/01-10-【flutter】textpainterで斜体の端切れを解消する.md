---
title: "【Flutter】TextPainterで斜体の端切れを解消する"
pubDate: 2025-01-10
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## TextPainter

TextPainterは、Flutterでテキストを描画する時に使用します。画像に重ねたりもできます。

ただ斜体だと、幅の計算がうまくいきません。そのため、端が切れてしまったりします。

## 解決

斜体での端切れ問題を解決するために、以下のようにします。大きめのキャンバスに書いて、trimしています。

```dart
import 'package:image/image.dart' as img;

final textPainter = TextPainter(
    text: TextSpan(
      text: 'Test',
      style: TextStyle(
        fontSize: 500,
        fontStyle: FontStyle.italic,
        fontFamily: 'Sans Serif',
      ),
    ),
  );

// テキストのサイズを計算
textPainter.layout();

// テキストのキャンバスサイズを設定
final textWidth = textPainter.width.ceil() * 1.5; // 大きめにする
final textHeight = textPainter.height.ceil();

// テキストを描画
final recorder = ui.PictureRecorder();
final canvas = Canvas(recorder);
textPainter.paint(canvas, Offset.zero);

// テキストの画像を生成
final textImage = await recorder
    .endRecording()
    .toImage(textWidth.toInt(), textHeight);
final textBytes =
    await textImage.toByteData(format: ui.ImageByteFormat.png);
var resultImage = img.decodeImage(textBytes!.buffer.asUint8List());

// trimする
resultImage = img.trim(resultImage!);
```

この他にも、計算方法を変えたり色々やってみたのですが、どうも斜体だと正確な計算はできないようです。そのため、今回のようにtrim手法を使いました。
