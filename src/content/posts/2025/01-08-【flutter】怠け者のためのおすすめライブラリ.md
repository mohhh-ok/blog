---
title: "【Flutter】怠け者のためのおすすめライブラリ"
pubDate: 2025-01-08
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Flutterのライブラリ事情

Flutterは、ライブラリがそれほど充実していない印象があります。Nodeならこんなライブラリあるのに。Reactならもっと楽にできるのに。そんな怠け者の私が、定番も含めて、ChatGPT先生に愚痴りながら見つけたライブラリを紹介していきます。

## おすすめライブラリ

### freezed

定番かと思います。クラスに便利な関数を追加します。詳細は以下で解説しています。

http://www.masaakiota.net/2025/01/06/%e3%80%90flutter%e3%80%91%e3%82%aa%e3%83%96%e3%82%b8%e3%82%a7%e3%82%af%e3%83%88%e3%82%92%e4%be%bf%e5%88%a9%e3%81%ab%e3%81%99%e3%82%8bfreezed-json\_serializable

### shared\_preferences

こちらもおそらく定番です。情報をストレージに保存します。キーバリュー型です。

以下のように使用します。String以外にもいろいろあります。

```dart
final prefs = await SharedPreferences.getInstance();
await prefs.setString('data', 'test');
final data = prefs.getString('data');
print(data);
```

### adaptive\_dialog

ダイアログ周りが素敵です。以下の機能が使えます。

*   showOkAlertDialog
*   showOkCancelAlertDialog
*   showConfirmationDialog
*   showModalActionSheet
*   showTextInputDialog
*   showTextAnswerDialog

なお親でmaterial3テーマを適用していたのですが、見た目を合わせるためにstyle: AdaptiveStyle.material を指定する必要がありました。

### gap

間隔を開けます。以下のように使用します。

```dart
Column(
  children:[
    const Text('aaa'),
    Gap(10),
    const Text('bbb'),
  ]
)
```

### flex\_color\_picker

色選択UIです。似たものにflutter\_colorpickerもあるのですが、ウィンドウサイズが変わると残念なことになります。一方flex\_color\_pickerは、かなり柔軟に対応してくれます。デザインも秀逸です。
