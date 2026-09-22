---
title: "【Python】フォーマッタがimport順を変えてしまう問題"
pubDate: 2025-08-05
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Python

Pythonは手軽なスクリプティングが好かれています。2025年8月5日現在では、機械学習によく用いられていることもあり、使う必要が出てきたりもします。

そこで、普段は違う言語を使っている勢からすると、稲妻カルチャーショックを受けることも少なくありません。

## PEP8

PEP8はPythonにおけるコーディング規約です。

[https://pep8-ja.readthedocs.io/ja/latest](https://pep8-ja.readthedocs.io/ja/latest)

これによると、imort文は常に先頭におけと書かれています。

## フォーマッタの功罪

私はよくわからず、Cursor (VS Code)でのPythonフォーマッタはautopep8を使用しています。prettier撲滅連盟に加入しているのと、他によく知らないためです。autopep8では、PEP8に沿った書き方に自動で整形されます。

たとえばimportがファイルの下の方にあると、強制的に上に持っていかれます。そのため、順番が崩れてしまいます。こんな、実行に影響するような箇所を勝手に変更するのは、いかがなものかと思うのですが、とにかくautopep8はそういうフォーマッタのようです。

具体的には、下記の問題がありました。

```python
import sys
sys.path.insert(0, "/root/ai-toolkit")
from toolkit.job import get_job
```

これをフォーマットすると、下記のようになります。

```python
import sys
from toolkit.job import get_job
sys.path.insert(0, "/root/ai-toolkit")
```

このためget\_jobをimportできないという事案が発生しました。Githubからそのまま持ってきたコードです。これは困りました。

## フォーマッタでimport関連を無視する

下記のようにすれば、import関連のフォーマットを無視できます。VSCodeの設定ファイル、settings.jsonです。

```json
{
  "[python]": {
    "editor.defaultFormatter": "ms-python.autopep8",
    ....
  },
  "autopep8.args": [
    "--ignore=E402" // import関連のエラーを無視
  ]
}
```

これで、フォーマッタが勝手にimort文を並び替えることは無くなります。

しかしながら、フォーマッタがなぜここまで関与してくるのか、謎で仕方ありません。Pythonは、import名が実際のライブラリ名と違う場合があるという愛すべき不思議ちゃんです。そうしたことから、勝手にimportを並び替えて欲しいという願いがあるのでしょうかいや関係ないかもしれません。余談ですがJavaScriptからTypeScriptが生まれたように、PythonもTypeThonみたいなのが出るのを切に願っています。
