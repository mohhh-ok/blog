---
title: "Django compilemessagesでvenvが対象になってしまう問題と解消方法"
pubDate: 2023-09-05
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

最近Reactを初めて触りまして、自動でwebpackしてくれる快適さに鼻水を垂らして感激している今日この頃です。

## Django compilemessages

Djangoで以下のコマンドを入れると、翻訳ファイルをコンパイルしてくれるというものです。

```
python manage.py compilemessages
```

これが、python仮想環境用フォルダのvenv内まで走査してしまって、とんでもない量のメッセージを吐き出すんですね。

この解決に、以下のようにします。

```
python manage.py compilemessages --ignore=venv
```

これで解決しました。いやぁ、めでたいめでたい。
