---
title: "【Python】freeze以外の選択肢pipreqs"
pubDate: 2025-02-02
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## freeze

freezeは、すべての使用ライブラリを書き出します。

```
pip freeze > requirements.txt
```

依存関係全てが洗い出されるので、量がとても多くなります。

## pipreqs

一方pipreqsだと、最低限のライブラリのみ書き出されます。

```
pip install pipreqs
pipreqs .
```

とても見やすくて、どのライブラリを入れたかがわかりやすいです。

## どちらを使うか

完全な依存関係を再現したい場合は、freezeを使ったほうが良さそうです。一方でそれほど再現性が重要ではない場合は、pipreqsで良さそうです。
