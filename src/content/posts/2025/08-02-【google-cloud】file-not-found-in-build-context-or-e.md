---
title: "【Google Cloud】file not found in build context or excluded by .dockerignore"
pubDate: 2025-08-02
categories: ["Google Cloud"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Google Cloudのデプロイでエラー

下記のコマンドでエラーになりました。

```
gcloud run deploy ...
```

```
file not found in build context or excluded by .dockerignore
```

過去にデプロイ成功しているプロジェクトだったため、悩みました。AIに聞いてもなかなか解決しません。しかし普通にGoogle検索するとすぐに原因がわかりました。

## .gitignoreが原因だった

.gitignoreに指定されているものは、gcloudにアップロードされないようです。今回、

```
.yarn
```

が.gitignoreに追加されていたため、それがアップロードされずにエラーになっていました。

AIさんしっかりしてくれと言いたいところですが、ログを辿るとしっかりAIに指摘されていました。。。とはいえその解決策が別のアプローチだっため、結果的に脱線していったようです。結局使う人間側の知識が必要ですね。
