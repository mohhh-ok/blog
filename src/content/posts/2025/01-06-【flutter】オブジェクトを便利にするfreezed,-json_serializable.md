---
title: "【Flutter】オブジェクトを便利にするfreezed, json_serializable"
pubDate: 2025-01-06
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Flutter

Flutterはクロスプラットフォーム開発環境です。普段JavaScriptに慣れていると、面倒だと感じることも多いのですが、今回はそれを解決していきます。

## build\_runner

まずはbuild\_runnerをインストールします。

```bash
flutter pub add dev:build_runner
```

以下のようにして、自動生成します。

```bash
dart run build_runner build
```

監視を続けるには、watchを使用します。

```bash
dart run build_runner watch
```

## freezed

freezedは、クラスをまるでJavaScriptオブジェクトのように（語弊）扱えるようにします。以下のように使用します。

```bash
flutter pub add freezed_annotation dev:freezed
```

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';

@freezed
class User with _$User {
  const factory User({
    required String name,
    required int age,
  }) = _User;
}
```

```dart
const taro = User(name: 'Taro', age: 10);
print(taro); // 自動でtoString()が呼ばれる
print(taro.copyWith(age: 11)); // 年齢だけ変える
print(taro == User(name: 'Taro', age: 10)); // true
```

## json関連

jsonへのencode,decodeは、別ライブラリを追加します。

```bash
flutter pub add json_annotation dev:json_serializable
```

freezedをすでに使っているため、２行追加するだけです。

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';

// 追加
part 'user.g.dart';

@freezed
class User with _$User {
  const factory User({
    required String name,
    required int age,
  }) = _User;

  // 追加
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
```

```dart
print(taro.toJson()); // {name: Taro, age: 10}
print(User.fromJson(jsonDecode('{"name": "Taro", "age": 10}'))); // User(name: Taro, age: 10)
```
