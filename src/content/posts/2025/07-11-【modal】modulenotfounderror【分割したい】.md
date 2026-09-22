---
title: "【Modal】ModuleNotFoundError【分割したい】"
pubDate: 2025-07-11
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Modal

Modalはクラウド上でGPUが使えるサービスです。Pythonで簡単にイメージを作ったりできるのが売りのようです。

[https://modal.com](https://modal.com)

## ModuleNotFoundError

ローカルのソースファイルは、クラウドにアップロードされる際に自動選別されます。そのため、下記のような場合

```
- /
  - __init__.py
  - /common
    - __init__.py
    - xx.py
  - /train
    - __init__.py
    - main.py
```

main.pyには@app.entrypointがあります。こうした場合、下記を実行すると

```
modal run train/main.py
```

ロードされるのはtrainモジュールのみとなります。

```
Created mount PythonPackage:train
```

commonが含まれていません。そのため、エラーとなります。

```
ModuleNotFoundError
```

ModalのExampleコードはそれぞれが１ファイルにまとめられているため、今回のような分割タイプのサンプルがありません。かなり吸ったんもん出した挙句、下記のようにすればいいことがわかりました。

```python
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    ...
).add_local_python_source(
    "common",
    "train",
)

app = modal.App("dreambooth-test-train-generate",
                image=image, include_source=True)

```

add\_local\_python\_sourceでモジュール名を指定すれば、イメージに含まれてばんばんざいです。
