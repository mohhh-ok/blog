---
title: "【Flutter】requires a higher minimum macOS deployment version【罠】"
pubDate: 2025-01-20
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Flutter

Flutterはクロスプラットフォーム開発のフレームワークです。OSごとの設定が必要なこともあり、なかなか大変な部分もあります。

## MacOSの対象バージョンを上げる

MacOS関連は、大抵はXCodeを用いて行います。今回、以下のエラーが出ました。

```
The plugin "macos_window_utils" requires a higher minimum macOS deployment version
```

そういえば、前もこんなエラーが出たなと、鼻歌気分でXCodeから以下の変更を行いました。

Runner > General > Minimum Deploymentsを、Big Sur11に変更

これでよしっと、おや。。。な、なおらないぞ！！！

結局、Podfileもいじらないといけないようです。一行目を変更します。

```
platform :osx, '11.5'
```

これでエラーが解消されました。これまでにも遭遇した覚えはあるのですが、適当にやっているのが丸わかりです。しかしXCode、おそるべし。。。
