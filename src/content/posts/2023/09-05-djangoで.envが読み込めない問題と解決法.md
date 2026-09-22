---
title: "Djangoで.envが読み込めない問題と解決法"
pubDate: 2023-09-05
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Djangoで.envが読み込めない

今回、以下の問題に遭遇しました。

通常のDjangoではsettings.pyが存在するのですが、その派生であるWagtailでは、settingsディレクトリにあるbase.pyを編集する形となっています。今回の問題がそれによるものかよく分かっていないのですが、.envが読み込めませんでした。

```
from decouple import Config

BASE_DIR = os.path.dirname(PROJECT_DIR)

env_path = os.path.join(BASE_DIR, '.env')
config = Config(env_path)
SECRET_KEY =config.get("DJANGO_SECRET_KEY")
```

## 解決策

このissueが、Githubに立てられています。

以下の投稿がありました。

> .env is searched starting on the main module directory going upwards on the directory tree.
> 
> https://github.com/HBNetwork/python-decouple/issues/99

ほほうなるほど、よくわからないですがともかくこの投稿に合った解決策が以下です。

```
from decouple import Config, RepositoryEnv

config = Config(RepositoryEnv("path/to/env_file"))
```

なんでもファイルパスをspecifyするそうです。何はともあれ、これで動くようになりました。
